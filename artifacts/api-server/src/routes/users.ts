import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, smsLogsTable, accountsTable } from "@workspace/db/schema";
import { RegisterUserBody, ListUsersResponse, GetUserResponse } from "@workspace/api-zod";
import { eq, desc, max } from "drizzle-orm";
import { hashPassword } from "./auth";
import { sendSms, normalizeE164 } from "../lib/signalwire.js";
import { sendWelcomeEmail } from "../lib/email.js";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  try {
    const body = RegisterUserBody.parse(req.body);
    const rawPassword = (req.body as Record<string, unknown>).password as string | undefined;
    const rawEmail = (req.body as Record<string, unknown>).email as string | undefined;
    const passwordHash = rawPassword && rawPassword.length >= 6
      ? await hashPassword(rawPassword)
      : undefined;

    const normalizedPhone = body.phoneNumber.replace(/\D/g, "");
    const normalizedEmail = rawEmail?.trim().toLowerCase() || null;
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const [user] = await db.insert(usersTable).values({
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      firstName: body.firstName,
      lastName: body.lastName,
      passwordHash,
      smsConsent: body.smsConsent,
      consentDate: body.smsConsent ? new Date() : null,
      optedOut: false,
      onboardingStatus: "pending",
      phoneVerified: false,
      phoneVerificationCode: verificationCode,
      phoneVerificationExpiry: verificationExpiry,
    }).returning();

    // Send SMS verification (fire-and-forget)
    const e164 = normalizeE164(normalizedPhone);
    if (e164) {
      sendSms(e164, `Your Text Banks verification code is: ${verificationCode}\n\nThis code expires in 10 minutes.`)
        .catch((err) => console.error("[Register] SMS send failed:", err instanceof Error ? err.message : err));
    }

    // Send welcome email (fire-and-forget)
    if (normalizedEmail) {
      sendWelcomeEmail(normalizedEmail, body.firstName, normalizedPhone)
        .catch((err) => console.error("[Register] Email send failed:", err instanceof Error ? err.message : err));
    }

    const { phoneVerificationCode: _vc, ...safeUser } = user as typeof user & { phoneVerificationCode?: string };
    res.status(201).json(safeUser);
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    const causeErr = err?.cause as Record<string, unknown> | undefined;
    const pgCode = err?.code || causeErr?.code;
    const msgStr = String(err?.message || "");

    if (pgCode === "23505" || msgStr.includes("23505") || msgStr.includes("unique")) {
      if (msgStr.toLowerCase().includes("email")) {
        return res.status(409).json({ error: "duplicate_email", message: "This email is already registered. Try signing in instead." });
      }
      return res.status(409).json({
        error: "duplicate_phone",
        message: "This phone number is already registered. Please use a different number.",
      });
    }
    const message = e instanceof Error ? e.message : "Registration failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

router.get("/", async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const lastSmsSubquery = await db
    .select({ userId: smsLogsTable.userId, lastSmsAt: max(smsLogsTable.createdAt) })
    .from(smsLogsTable)
    .groupBy(smsLogsTable.userId);

  const lastSmsMap = new Map(lastSmsSubquery.map((r) => [r.userId, r.lastSmsAt]));

  const accounts = await db.select().from(accountsTable);
  const accountsMap = new Map<number, typeof accounts>();
  for (const acc of accounts) {
    if (!accountsMap.has(acc.userId)) accountsMap.set(acc.userId, []);
    accountsMap.get(acc.userId)!.push(acc);
  }

  const result = users.map((u) => ({
    ...u,
    accounts: (accountsMap.get(u.id) || []).map((a) => ({
      ...a,
      currentBalance: Number(a.currentBalance),
    })),
    lastSmsAt: lastSmsMap.get(u.id) || null,
  }));

  res.json(result);
});

router.patch("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const { firstName, lastName, optedOut, onboardingStatus, plan } = req.body as {
    firstName?: string;
    lastName?: string;
    optedOut?: boolean;
    onboardingStatus?: string;
    plan?: string;
  };

  const updates: Record<string, unknown> = {};
  if (firstName !== undefined) updates.firstName = firstName.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
  if (lastName !== undefined) updates.lastName = lastName.trim().replace(/\b\w/g, (c: string) => c.toUpperCase());
  if (optedOut !== undefined) updates.optedOut = optedOut;
  if (onboardingStatus !== undefined) updates.onboardingStatus = onboardingStatus;
  if (plan !== undefined && (plan === "basic" || plan === "pro" || plan === "premium")) updates.plan = plan;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "bad_request", message: "No fields to update" });
  }

  try {
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    if (!updated) return res.status(404).json({ error: "not_found", message: "User not found" });
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
    const { passwordHash: _pw, ...safe } = updated as typeof updated & { passwordHash?: string };
    res.json({ ...safe, accounts: accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) })) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    return res.status(404).json({ error: "not_found", message: "User not found" });
  }

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  const [lastSmsRow] = await db
    .select({ lastSmsAt: max(smsLogsTable.createdAt) })
    .from(smsLogsTable)
    .where(eq(smsLogsTable.userId, userId));

  const result = {
    ...user,
    accounts: accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) })),
    lastSmsAt: lastSmsRow?.lastSmsAt || null,
  };

  res.json(result);
});

export default router;
