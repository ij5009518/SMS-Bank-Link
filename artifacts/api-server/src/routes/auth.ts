import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { sendSms, normalizeE164 } from "../lib/signalwire.js";
import { sendWelcomeEmail } from "../lib/email.js";

const scryptAsync = promisify(scrypt);
const router: IRouter = Router();

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

router.post("/login", async (req, res) => {
  const { phoneNumber, password } = req.body as { phoneNumber?: string; password?: string };

  if (!phoneNumber || !password) {
    return res.status(400).json({ error: "bad_request", message: "Phone number and password are required." });
  }

  const normalized = phoneNumber.replace(/\D/g, "");
  const allUsers = await db.select().from(usersTable);
  const user = allUsers.find((u) => u.phoneNumber.replace(/\D/g, "") === normalized);

  if (!user) {
    return res.status(401).json({ error: "invalid_credentials", message: "No account found for that phone number." });
  }

  if (!user.passwordHash) {
    return res.status(401).json({ error: "no_password", message: "This account was registered without a password. Please use the register page to set one up." });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "invalid_credentials", message: "Incorrect password." });
  }

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
  const accountsSafe = accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }));

  res.json(safeUser(user, accountsSafe));
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

  try {
    const [user] = await db.insert(usersTable).values({
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      firstName,
      lastName,
      passwordHash,
      smsConsent: !!smsConsent,
      consentDate: smsConsent ? new Date() : null,
      optedOut: false,
      onboardingStatus: "pending",
      phoneVerified: false,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpiry: verificationExpiry,
    }).returning();

    // Send SMS verification code (fire-and-forget — don't block response)
    const e164 = normalizeE164(normalizedPhone);
    if (e164) {
      sendSms(e164, `Your Text Banks verification code is: ${verificationCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.`)
        .catch((err) => console.error("[Auth] Failed to send verification SMS:", err instanceof Error ? err.message : err));
    }

    // Send welcome email (fire-and-forget)
    if (normalizedEmail) {
      sendWelcomeEmail(normalizedEmail, firstName, normalizedPhone)
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

router.post("/verify-phone", async (req, res) => {
  const { userId, code } = req.body as { userId?: number; code?: string };

  if (!userId || !code) {
    return res.status(400).json({ error: "bad_request", message: "User ID and verification code are required." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found." });
  }

  if (user.phoneVerified) {
    return res.json({ success: true, message: "Phone already verified." });
  }

  if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
    return res.status(400).json({ error: "no_code", message: "No verification code found. Please request a new one." });
  }

  if (new Date() > new Date(user.phoneVerificationExpiry)) {
    return res.status(400).json({ error: "code_expired", message: "This code has expired. Please request a new one." });
  }

  if (user.phoneVerificationCode !== code.trim()) {
    return res.status(400).json({ error: "invalid_code", message: "That code is incorrect. Please check your SMS and try again." });
  }

  const [updated] = await db.update(usersTable)
    .set({ phoneVerified: true, phoneVerificationCode: null, phoneVerificationExpiry: null, onboardingStatus: "active" })
    .where(eq(usersTable.id, userId))
    .returning();

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  res.json({ success: true, user: safeUser(updated, accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) }))) });
});

router.post("/resend-verification", async (req, res) => {
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

export { hashPassword };
export default router;
