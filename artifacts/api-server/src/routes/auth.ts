import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable, trustedDevicesTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { sendSms, normalizeE164 } from "../lib/signalwire.js";
import { sendWelcomeEmail, sendEmailVerificationEmail, sendDeviceVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";
import { OAuth2Client } from "google-auth-library";
import { createRouteLimiter, enforceRetryLockout, recordRetryFailure, clearRetryFailures, retryPolicies } from "../middleware/security.js";

const scryptAsync = promisify(scrypt);
const router: IRouter = Router();

const loginLimiter = createRouteLimiter({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: "Too many login attempts. Please try again later.",
});

const otpLimiter = createRouteLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: "Too many verification attempts. Please wait before trying again.",
});

const passwordResetLimiter = createRouteLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many password reset attempts. Please wait before trying again.",
});

function capitalizeName(name: string): string {
  return name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedKey] = hash.split(":");
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  const storedKeyBuf = Buffer.from(storedKey, "hex");
  return timingSafeEqual(derivedKey, storedKeyBuf);
}

function safeUser(user: typeof usersTable.$inferSelect, accounts: Array<Record<string, unknown>>) {
  const { passwordHash: _pw, phoneVerificationCode: _vc, ...rest } = user as typeof user & {
    passwordHash?: string;
    phoneVerificationCode?: string;
  };
  return { ...rest, accounts };
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

router.post("/login", loginLimiter, async (req, res) => {
  const { phoneNumber, password, deviceToken } = req.body as {
    phoneNumber?: string;
    password?: string;
    deviceToken?: string;
  };

  if (!phoneNumber || !password) {
    return res.status(400).json({ error: "bad_request", message: "Phone number and password are required." });
  }

  const normalized = phoneNumber.replace(/\D/g, "");
  const subject = normalized || "anonymous";

  if (enforceRetryLockout(req, res, retryPolicies.userLogin, subject)) {
    return;
  }

  const allUsers = await db.select().from(usersTable);
  const user = allUsers.find((u) => u.phoneNumber.replace(/\D/g, "") === normalized);

  if (!user || !user.passwordHash) {
    recordRetryFailure(req, retryPolicies.userLogin, subject);
    return res.status(401).json({ error: "invalid_credentials", message: "Invalid phone number or password." });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordRetryFailure(req, retryPolicies.userLogin, subject);
    return res.status(401).json({ error: "invalid_credentials", message: "Invalid phone number or password." });
  }

  clearRetryFailures(req, retryPolicies.userLogin, subject);

  // Check if device is trusted
  if (deviceToken) {
    const [trusted] = await db.select().from(trustedDevicesTable).where(
      and(
        eq(trustedDevicesTable.userId, user.id),
        eq(trustedDevicesTable.token, deviceToken),
        gt(trustedDevicesTable.expiresAt, new Date())
      )
    );
    if (trusted) {
      // Known device — log in immediately
      const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
      return res.json({ ...safeUser(user, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))), deviceVerified: true });
    }
  }

  // Unknown device — require device verification before granting access
  return res.status(403).json({
    error: "device_unverified",
    userId: user.id,
    firstName: user.firstName,
    email: user.email ? maskEmail(user.email) : null,
    message: "New device detected. Please verify this device to continue.",
  });
});

router.post("/signup", async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password, smsConsent } = req.body as {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    smsConsent?: boolean;
  };

  if (!firstName || !lastName || !phoneNumber || !password) {
    return res.status(400).json({ error: "bad_request", message: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "bad_request", message: "Password must be at least 6 characters." });
  }

  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const passwordHash = await hashPassword(password);
  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const emailVerificationToken = normalizedEmail ? randomBytes(32).toString("hex") : null;
  const emailVerificationTokenExpiry = emailVerificationToken ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null; // 72 hours

  try {
    const [user] = await db.insert(usersTable).values({
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      firstName: capitalizeName(firstName),
      lastName: capitalizeName(lastName),
      passwordHash,
      smsConsent: !!smsConsent,
      consentDate: smsConsent ? new Date() : null,
      optedOut: false,
      onboardingStatus: "pending",
      phoneVerified: false,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpiry: verificationExpiry,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiry,
    }).returning();

    // Send SMS verification code (fire-and-forget)
    const e164 = normalizeE164(normalizedPhone);
    if (e164) {
      sendSms(e164, `Your Text Banks verification code is: ${verificationCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.`)
        .catch((err) => console.error("[Auth] Failed to send verification SMS:", err instanceof Error ? err.message : err));
    }

    // Send welcome email with embedded verification link (fire-and-forget)
    if (normalizedEmail && emailVerificationToken) {
      sendWelcomeEmail(normalizedEmail, firstName, normalizedPhone, emailVerificationToken)
        .catch((err) => console.error("[Auth] Failed to send welcome email:", err instanceof Error ? err.message : err));
    }

    res.status(201).json(safeUser(user, []));
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    const causeErr = err?.cause as Record<string, unknown> | undefined;
    const pgCode = err?.code || causeErr?.code;
    const msgStr = String(err?.message || "");
    if (pgCode === "23505" || msgStr.includes("23505") || msgStr.includes("unique")) {
      if (msgStr.toLowerCase().includes("email")) {
        return res.status(409).json({ error: "duplicate_email", message: "This email address is already registered. Try signing in instead." });
      }
      return res.status(409).json({ error: "duplicate_phone", message: "This phone number is already registered. Try signing in instead." });
    }
    const message = e instanceof Error ? e.message : "Sign up failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

router.post("/verify-phone", otpLimiter, async (req, res) => {
  const { userId, code } = req.body as { userId?: number; code?: string };
  const subject = String(userId ?? "anonymous");

  if (enforceRetryLockout(req, res, retryPolicies.otp, subject)) {
    return;
  }

  if (!userId || !code) {
    return res.status(400).json({ error: "bad_request", message: "User ID and verification code are required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    recordRetryFailure(req, retryPolicies.otp, String(userId));
    return res.status(404).json({ error: "not_found", message: "Invalid or expired verification code." });
  }

  if (user.phoneVerified) {
    return res.json({ success: true, message: "Phone already verified." });
  }

  if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
    return res.status(400).json({ error: "no_code", message: "No verification code found. Please request a new one." });
  }

  if (new Date() > new Date(user.phoneVerificationExpiry)) {
    recordRetryFailure(req, retryPolicies.otp, subject);
    return res.status(400).json({ error: "code_expired", message: "Invalid or expired verification code." });
  }

  if (user.phoneVerificationCode !== code.trim()) {
    recordRetryFailure(req, retryPolicies.otp, String(userId));
    return res.status(400).json({ error: "invalid_code", message: "Invalid or expired verification code." });
  }

  clearRetryFailures(req, retryPolicies.otp, subject);

  const [updated] = await db.update(usersTable)
    .set({ phoneVerified: true, phoneVerificationCode: null, phoneVerificationExpiry: null, onboardingStatus: "active" })
    .where(eq(usersTable.id, userId))
    .returning();

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  res.json({ success: true, user: safeUser(updated, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
});

router.post("/resend-verification", otpLimiter, async (req, res) => {
  const { userId } = req.body as { userId?: number };

  if (!userId) {
    return res.status(400).json({ error: "bad_request", message: "User ID is required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found." });
  }

  if (user.phoneVerified) {
    return res.json({ success: true, message: "Phone is already verified." });
  }

  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(usersTable)
    .set({ phoneVerificationCode: verificationCode, phoneVerificationExpiry: verificationExpiry })
    .where(eq(usersTable.id, userId));

  const e164 = normalizeE164(user.phoneNumber);
  if (e164) {
    try {
      await sendSms(e164, `Your new Text Banks code is: ${verificationCode}\n\nExpires in 10 minutes.`);
    } catch {
      return res.status(500).json({ error: "sms_failed", message: "Could not send SMS. Please check your phone number and try again." });
    }
  }

  res.json({ success: true, message: "New code sent." });
});

// ── Email Verification ──

router.post("/verify-email", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: "bad_request", message: "Token is required." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.emailVerificationToken, token));
  if (!user) return res.status(404).json({ error: "invalid_token", message: "This verification link is invalid or has already been used." });

  if (user.emailVerificationTokenExpiry && new Date() > new Date(user.emailVerificationTokenExpiry)) {
    return res.status(400).json({ error: "token_expired", message: "This verification link has expired. Request a new one from your account settings." });
  }

  const [updated] = await db.update(usersTable)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null })
    .where(eq(usersTable.id, user.id))
    .returning();

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
  res.json({ success: true, user: safeUser(updated, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
});

router.post("/resend-email-verification", async (req, res) => {
  const { userId } = req.body as { userId?: number };
  if (!userId) return res.status(400).json({ error: "bad_request", message: "User ID is required." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "not_found", message: "User not found." });
  if (!user.email) return res.status(400).json({ error: "no_email", message: "No email address on file." });
  if (user.emailVerified) return res.json({ success: true, message: "Email is already verified." });

  const newToken = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await db.update(usersTable)
    .set({ emailVerificationToken: newToken, emailVerificationTokenExpiry: expiry })
    .where(eq(usersTable.id, userId));

  try {
    await sendEmailVerificationEmail(user.email, user.firstName, newToken);
  } catch {
    return res.status(500).json({ error: "email_failed", message: "Could not send verification email. Please try again." });
  }

  res.json({ success: true, message: "Verification email sent." });
});

// ── Device Verification ──

// Step 1 — send a code to the user's email to verify this device
router.post("/send-device-code", otpLimiter, async (req, res) => {
  const { userId } = req.body as { userId?: number };
  if (!userId) return res.status(400).json({ error: "bad_request", message: "User ID is required." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "not_found", message: "User not found." });

  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.update(usersTable)
    .set({ deviceVerificationCode: code, deviceVerificationExpiry: expiry })
    .where(eq(usersTable.id, userId));

  // Send via email if available, otherwise via SMS
  let sent = false;
  if (user.email) {
    try {
      await sendDeviceVerificationEmail(user.email, user.firstName, code);
      sent = true;
    } catch {
      console.warn("[Auth] Could not send device code via email, falling back to SMS");
    }
  }
  if (!sent) {
    const e164 = normalizeE164(user.phoneNumber);
    if (e164) {
      try {
        await sendSms(e164, `Text Banks security code: ${code}\n\nSomeone is signing in from a new device. If this was you, enter the code to continue. Expires in 10 minutes.`);
        sent = true;
      } catch {
        return res.status(500).json({ error: "send_failed", message: "Could not send verification code. Please try again." });
      }
    }
  }

  res.json({
    success: true,
    via: user.email ? "email" : "sms",
    destination: user.email ? maskEmail(user.email) : user.phoneNumber.slice(-4),
  });
});

// Step 2 — verify the code and register this device as trusted
router.post("/verify-device", otpLimiter, async (req, res) => {
  const { userId, code, deviceName } = req.body as { userId?: number; code?: string; deviceName?: string };
  const subject = String(userId ?? "anonymous");
  if (enforceRetryLockout(req, res, retryPolicies.otp, subject)) {
    return;
  }
  if (!userId || !code) return res.status(400).json({ error: "bad_request", message: "User ID and code are required." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "not_found", message: "User not found." });

  if (!user.deviceVerificationCode || !user.deviceVerificationExpiry) {
    return res.status(400).json({ error: "no_code", message: "No verification code found. Please request a new one." });
  }
  if (new Date() > new Date(user.deviceVerificationExpiry)) {
    recordRetryFailure(req, retryPolicies.otp, subject);
    return res.status(400).json({ error: "code_expired", message: "Invalid or expired verification code." });
  }
  if (user.deviceVerificationCode !== code.trim()) {
    recordRetryFailure(req, retryPolicies.otp, subject);
    return res.status(400).json({ error: "invalid_code", message: "Invalid or expired verification code." });
  }

  clearRetryFailures(req, retryPolicies.otp, subject);

  // Clear the code and create a trusted device record
  await db.update(usersTable)
    .set({ deviceVerificationCode: null, deviceVerificationExpiry: null })
    .where(eq(usersTable.id, userId));

  const deviceToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(trustedDevicesTable).values({
    userId,
    token: deviceToken,
    deviceName: deviceName || "Browser",
    expiresAt,
  });

  // Return the full user so the frontend can log them in
  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  const safeU = safeUser(user, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) })));

  res.json({ success: true, deviceToken, user: safeU });
});

// Re-verify current phone (works even if already verified — resets to unverified)
router.post("/reverify-phone", otpLimiter, async (req, res) => {
  const { userId } = req.body as { userId?: number };

  if (!userId) {
    return res.status(400).json({ error: "bad_request", message: "User ID is required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found." });
  }

  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(usersTable)
    .set({ phoneVerified: false, phoneVerificationCode: verificationCode, phoneVerificationExpiry: verificationExpiry })
    .where(eq(usersTable.id, userId));

  const e164 = normalizeE164(user.phoneNumber);
  if (!e164) {
    return res.status(400).json({ error: "bad_phone", message: "Phone number is invalid." });
  }

  try {
    await sendSms(e164, `Your Text Banks verification code is: ${verificationCode}\n\nExpires in 10 minutes. Do not share it.`);
  } catch {
    return res.status(500).json({ error: "sms_failed", message: "Could not send SMS. Please try again." });
  }

  res.json({ success: true, message: "Verification code sent." });
});

// Request a phone number change — sends OTP to the NEW number
router.post("/request-phone-change", otpLimiter, async (req, res) => {
  const { userId, newPhoneNumber } = req.body as { userId?: number; newPhoneNumber?: string };

  if (!userId || !newPhoneNumber) {
    return res.status(400).json({ error: "bad_request", message: "User ID and new phone number are required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found." });
  }

  const normalizedNew = newPhoneNumber.replace(/\D/g, "");
  if (normalizedNew.length < 10) {
    return res.status(400).json({ error: "bad_phone", message: "Please enter a valid phone number." });
  }

  // Make sure it's not already taken by another account
  const allUsers = await db.select().from(usersTable);
  const conflict = allUsers.find((u) =>
    u.id !== userId && u.phoneNumber.replace(/\D/g, "").replace(/^1/, "") === normalizedNew.replace(/^1/, "")
  );
  if (conflict) {
    return res.status(409).json({ error: "duplicate_phone", message: "That number is already linked to another account." });
  }

  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(usersTable)
    .set({ pendingPhoneNumber: normalizedNew, pendingPhoneCode: code, pendingPhoneExpiry: expiry })
    .where(eq(usersTable.id, userId));

  const e164 = normalizeE164(normalizedNew);
  if (!e164) {
    return res.status(400).json({ error: "bad_phone", message: "Phone number format is not supported." });
  }

  try {
    await sendSms(e164, `Your Text Banks phone change code is: ${code}\n\nEnter this to confirm your new number. Expires in 10 minutes.`);
  } catch {
    return res.status(500).json({ error: "sms_failed", message: "Could not send SMS to that number. Check it and try again." });
  }

  res.json({ success: true, message: "Verification code sent to new number." });
});

// Confirm phone change — verify OTP sent to the new number
router.post("/confirm-phone-change", otpLimiter, async (req, res) => {
  const { userId, code } = req.body as { userId?: number; code?: string };
  const subject = String(userId ?? "anonymous");

  if (enforceRetryLockout(req, res, retryPolicies.otp, subject)) {
    return;
  }

  if (!userId || !code) {
    return res.status(400).json({ error: "bad_request", message: "User ID and code are required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found." });
  }

  if (!user.pendingPhoneNumber || !user.pendingPhoneCode || !user.pendingPhoneExpiry) {
    return res.status(400).json({ error: "no_pending", message: "No phone change in progress. Please request a new code." });
  }

  if (new Date() > new Date(user.pendingPhoneExpiry)) {
    recordRetryFailure(req, retryPolicies.otp, subject);
    return res.status(400).json({ error: "code_expired", message: "Invalid or expired verification code." });
  }

  if (user.pendingPhoneCode !== code.trim()) {
    recordRetryFailure(req, retryPolicies.otp, subject);
    return res.status(400).json({ error: "invalid_code", message: "Invalid or expired verification code." });
  }

  clearRetryFailures(req, retryPolicies.otp, subject);

  const [updated] = await db.update(usersTable)
    .set({
      phoneNumber: user.pendingPhoneNumber,
      phoneVerified: true,
      pendingPhoneNumber: null,
      pendingPhoneCode: null,
      pendingPhoneExpiry: null,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  res.json({ success: true, user: safeUser(updated, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
});

// ── Forgot / Reset Password ───────────────────────────────────────────────
const WEBSITE_URL = process.env.WEBSITE_URL || "https://textbanks.app";

// Step 1: request reset — by email (sends link) or by phone (sends SMS OTP)
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  const { identifier } = req.body as { identifier?: string };
  const subject = (identifier || "anonymous").trim().toLowerCase();

  if (enforceRetryLockout(req, res, retryPolicies.passwordReset, subject)) {
    return;
  }

  if (!identifier) return res.status(400).json({ error: "bad_request", message: "Email or phone number is required." });

  const isEmail = identifier.includes("@");
  const allUsers = await db.select().from(usersTable);

  let user: typeof allUsers[number] | undefined;
  if (isEmail) {
    user = allUsers.find((u) => u.email?.toLowerCase() === identifier.toLowerCase().trim());
  } else {
    const digits = identifier.replace(/\D/g, "");
    user = allUsers.find((u) => u.phoneNumber.replace(/\D/g, "") === digits);
  }

  // Always respond 200 to prevent enumeration
  if (!user) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.json({ success: true, method: isEmail ? "email" : "sms" });
  }

  if (isEmail && user.email) {
    const token = randomBytes(40).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.update(usersTable).set({ passwordResetToken: token, passwordResetTokenExpiry: expiry }).where(eq(usersTable.id, user.id));
    const resetUrl = `${WEBSITE_URL}/my-account?reset_token=${token}`;
    sendPasswordResetEmail(user.email, user.firstName, resetUrl)
      .catch((e) => console.error("[Auth] Password reset email failed:", e instanceof Error ? e.message : e));
    clearRetryFailures(req, retryPolicies.passwordReset, subject);
    return res.json({ success: true, method: "email" });
  } else {
    // SMS OTP
    const otp = generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.update(usersTable).set({ passwordResetOtp: otp, passwordResetOtpExpiry: expiry }).where(eq(usersTable.id, user.id));
    const e164 = normalizeE164(user.phoneNumber);
    if (e164) {
      sendSms(e164, `Your Text Banks password reset code is: ${otp}\n\nExpires in 15 minutes. Do not share it.`)
        .catch((e) => console.error("[Auth] Password reset SMS failed:", e instanceof Error ? e.message : e));
    }
    clearRetryFailures(req, retryPolicies.passwordReset, subject);
    return res.json({ success: true, method: "sms", userId: user.id });
  }
});

// Step 2a: Reset via email token
router.post("/reset-password-token", passwordResetLimiter, async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  const subject = (token || "anonymous").trim().toLowerCase();

  if (enforceRetryLockout(req, res, retryPolicies.passwordReset, subject)) {
    return;
  }
  if (!token || !newPassword) return res.status(400).json({ error: "bad_request", message: "Token and new password are required." });
  if (newPassword.length < 6) return res.status(400).json({ error: "bad_request", message: "Password must be at least 6 characters." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.passwordResetToken, token));
  if (!user) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.status(404).json({ error: "invalid_token", message: "Unable to reset password with that code." });
  }
  if (user.passwordResetTokenExpiry && new Date() > new Date(user.passwordResetTokenExpiry)) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.status(400).json({ error: "token_expired", message: "Unable to reset password with that code." });
  }

  clearRetryFailures(req, retryPolicies.passwordReset, subject);
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash, passwordResetToken: null, passwordResetTokenExpiry: null }).where(eq(usersTable.id, user.id));
  return res.json({ success: true, message: "Your password has been updated. You can now sign in." });
});

// Step 2b: Reset via SMS OTP
router.post("/reset-password-otp", passwordResetLimiter, async (req, res) => {
  const { userId, otp, newPassword } = req.body as { userId?: number; otp?: string; newPassword?: string };
  const subject = `${userId ?? "anonymous"}:${otp ?? ""}`.trim().toLowerCase();

  if (enforceRetryLockout(req, res, retryPolicies.passwordReset, subject)) {
    return;
  }
  if (!userId || !otp || !newPassword) return res.status(400).json({ error: "bad_request", message: "User ID, OTP, and new password are required." });
  if (newPassword.length < 6) return res.status(400).json({ error: "bad_request", message: "Password must be at least 6 characters." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.status(404).json({ error: "not_found", message: "Unable to reset password with that code." });
  }
  if (!user.passwordResetOtp || user.passwordResetOtp !== otp) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.status(401).json({ error: "invalid_otp", message: "Unable to reset password with that code." });
  }
  if (user.passwordResetOtpExpiry && new Date() > new Date(user.passwordResetOtpExpiry)) {
    recordRetryFailure(req, retryPolicies.passwordReset, subject);
    return res.status(400).json({ error: "otp_expired", message: "Unable to reset password with that code." });
  }

  clearRetryFailures(req, retryPolicies.passwordReset, subject);
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash, passwordResetOtp: null, passwordResetOtpExpiry: null }).where(eq(usersTable.id, user.id));
  return res.json({ success: true, message: "Your password has been updated. You can now sign in." });
});

// ── Google Sign-In ──────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

router.get("/google/config", (_req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

router.post("/google", async (req, res) => {
  const { credential } = req.body as { credential?: string };
  if (!credential) return res.status(400).json({ error: "bad_request", message: "Google credential is required." });
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "not_configured", message: "Google Sign-In is not configured on this server." });
  }

  // Verify the Google ID token
  let payload: { sub: string; email: string; given_name?: string; family_name?: string; name?: string; email_verified?: boolean } | null = null;
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload() as typeof payload;
  } catch (err) {
    console.error("[Google Auth] Token verification failed:", err instanceof Error ? err.message : err);
    return res.status(401).json({ error: "invalid_token", message: "Could not verify your Google account. Please try again." });
  }

  if (!payload || !payload.sub || !payload.email) {
    return res.status(401).json({ error: "invalid_token", message: "Incomplete Google profile. Please try again." });
  }

  const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;
  const normalizedEmail = email.toLowerCase();

  // Try to find existing user by google_id or email
  const allUsers = await db.select().from(usersTable);
  let user = allUsers.find((u) => u.googleId === googleId) ?? allUsers.find((u) => u.email?.toLowerCase() === normalizedEmail);

  if (user) {
    // Link google_id if not already linked
    if (!user.googleId) {
      await db.update(usersTable).set({ googleId }).where(eq(usersTable.id, user.id));
    }
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
    return res.json({ success: true, user: safeUser(user, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
  }

  // New Google user — needs phone number to complete registration
  return res.status(200).json({
    needs_phone: true,
    google_id: googleId,
    email: normalizedEmail,
    first_name: firstName || "",
    last_name: lastName || "",
  });
});

// ── Google Sign-In: complete registration (new user, add phone) ─────────────
router.post("/google/complete", async (req, res) => {
  const { googleId, email, firstName, lastName, phoneNumber } = req.body as {
    googleId?: string; email?: string; firstName?: string; lastName?: string; phoneNumber?: string;
  };

  if (!googleId || !email || !phoneNumber) {
    return res.status(400).json({ error: "bad_request", message: "Google ID, email, and phone number are required." });
  }

  const normalized = phoneNumber.replace(/\D/g, "");
  if (normalized.length < 10) {
    return res.status(400).json({ error: "bad_phone", message: "Please enter a valid phone number." });
  }

  // Check for duplicates
  const allUsers = await db.select().from(usersTable);
  const phoneConflict = allUsers.find((u) => u.phoneNumber.replace(/\D/g, "") === normalized);
  if (phoneConflict) {
    return res.status(409).json({ error: "duplicate_phone", message: "That phone number is already registered. Try signing in instead." });
  }
  const googleConflict = allUsers.find((u) => u.googleId === googleId);
  if (googleConflict) {
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, googleConflict.id));
    return res.json({ success: true, user: safeUser(googleConflict, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
  }

  // Generate email verification token
  const emailVerificationToken = randomBytes(36).toString("hex");
  const emailVerificationTokenExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

  try {
    const [user] = await db.insert(usersTable).values({
      phoneNumber: normalized,
      email: email.toLowerCase(),
      firstName: firstName || "User",
      lastName: lastName || "",
      googleId,
      smsConsent: false,
      optedOut: false,
      onboardingStatus: "pending",
      phoneVerified: false,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiry,
    }).returning();

    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));

    // Send welcome email
    sendWelcomeEmail(email, user.firstName, normalized, emailVerificationToken)
      .catch((e) => console.error("[Google Complete] Email failed:", e instanceof Error ? e.message : e));

    return res.status(201).json({ success: true, user: safeUser(user, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
  } catch (e: unknown) {
    const msg = String((e as Record<string, unknown>)?.message || "");
    if (msg.includes("23505") || msg.includes("unique")) {
      return res.status(409).json({ error: "duplicate", message: "An account with that phone or email already exists." });
    }
    return res.status(500).json({ error: "server_error", message: "Could not create account. Please try again." });
  }
});

export { hashPassword };
export default router;
