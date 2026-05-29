import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, phoneNumbersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendSms, normalizeE164 } from "../lib/signalwire.js";
import { normalizePhone } from "@workspace/db/phone";

const router: IRouter = Router({ mergeParams: true });

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /api/users/:userId/phones — list all secondary phone numbers
router.get("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  const phones = await db.select().from(phoneNumbersTable).where(eq(phoneNumbersTable.userId, userId));
  res.json(phones);
});

// POST /api/users/:userId/phones — add a secondary phone number (premium only)
router.post("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  const { phoneNumber, label } = req.body as { phoneNumber?: string; label?: string };
  if (!phoneNumber) return res.status(400).json({ error: "bad_request", message: "Phone number is required." });

  // Premium check
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "not_found", message: "User not found." });
  if (user.plan !== "premium") {
    return res.status(403).json({ error: "plan_required", message: "Multiple phone numbers require a Premium plan." });
  }

  const normalized = normalizePhone(phoneNumber);
  if (normalized.length < 10) {
    return res.status(400).json({ error: "bad_phone", message: "Please enter a valid phone number." });
  }

  // Can't add the primary number again
  if (normalized === normalizePhone(user.phoneNumber)) {
    return res.status(409).json({ error: "duplicate_phone", message: "That is already your primary phone number." });
  }

  // Check not already on this account
  const existing = await db.select().from(phoneNumbersTable).where(
    and(eq(phoneNumbersTable.userId, userId), eq(phoneNumbersTable.phoneNumber, normalized))
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "duplicate_phone", message: "That number is already linked to this account." });
  }

  // Check not on another account (primary) — indexed lookup.
  const [conflict] = await db.select().from(usersTable).where(eq(usersTable.phoneNumber, normalized));
  if (conflict && conflict.id !== userId) {
    return res.status(409).json({ error: "duplicate_phone", message: "That number is already linked to another Text Banks account." });
  }

  const code = generateCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const [created] = await db.insert(phoneNumbersTable).values({
    userId,
    phoneNumber: normalized,
    label: label?.trim() || null,
    verified: false,
    verificationCode: code,
    verificationExpiry: expiry,
  }).returning();

  // Send OTP to the new number
  const e164 = normalizeE164(normalized);
  if (e164) {
    sendSms(e164, `Your Text Banks verification code is: ${code}\n\nEnter this code to link ${normalized} to your account. Expires in 10 minutes.`)
      .catch((err) => console.error("[Phones] Failed to send OTP:", err instanceof Error ? err.message : err));
  }

  res.status(201).json({ ...created, verificationCode: undefined });
});

// POST /api/users/:userId/phones/:phoneId/verify — verify OTP
router.post("/:phoneId/verify", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const phoneId = parseInt(req.params.phoneId);
  const { code } = req.body as { code?: string };

  if (isNaN(userId) || isNaN(phoneId)) return res.status(400).json({ error: "bad_request", message: "Invalid ID." });
  if (!code) return res.status(400).json({ error: "bad_request", message: "Code is required." });

  const [phone] = await db.select().from(phoneNumbersTable).where(
    and(eq(phoneNumbersTable.id, phoneId), eq(phoneNumbersTable.userId, userId))
  );
  if (!phone) return res.status(404).json({ error: "not_found", message: "Phone number not found." });
  if (phone.verified) return res.json({ success: true, message: "Already verified." });

  if (!phone.verificationCode || !phone.verificationExpiry) {
    return res.status(400).json({ error: "no_code", message: "No verification code. Please request a new one." });
  }
  if (new Date() > new Date(phone.verificationExpiry)) {
    return res.status(400).json({ error: "code_expired", message: "This code has expired. Please resend." });
  }
  if (phone.verificationCode !== code.trim()) {
    return res.status(400).json({ error: "invalid_code", message: "Incorrect code. Check your SMS and try again." });
  }

  const [updated] = await db.update(phoneNumbersTable)
    .set({ verified: true, verificationCode: null, verificationExpiry: null })
    .where(eq(phoneNumbersTable.id, phoneId))
    .returning();

  res.json({ success: true, phone: updated });
});

// POST /api/users/:userId/phones/:phoneId/resend — resend OTP
router.post("/:phoneId/resend", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const phoneId = parseInt(req.params.phoneId);

  if (isNaN(userId) || isNaN(phoneId)) return res.status(400).json({ error: "bad_request", message: "Invalid ID." });

  const [phone] = await db.select().from(phoneNumbersTable).where(
    and(eq(phoneNumbersTable.id, phoneId), eq(phoneNumbersTable.userId, userId))
  );
  if (!phone) return res.status(404).json({ error: "not_found", message: "Phone number not found." });
  if (phone.verified) return res.json({ success: true, message: "Already verified." });

  const code = generateCode();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(phoneNumbersTable)
    .set({ verificationCode: code, verificationExpiry: expiry })
    .where(eq(phoneNumbersTable.id, phoneId));

  const e164 = normalizeE164(phone.phoneNumber);
  if (e164) {
    try {
      await sendSms(e164, `Your new Text Banks code is: ${code}\n\nExpires in 10 minutes.`);
    } catch {
      return res.status(500).json({ error: "sms_failed", message: "Could not send SMS. Please try again." });
    }
  }

  res.json({ success: true, message: "Code resent." });
});

// PATCH /api/users/:userId/phones/:phoneId — update label
router.patch("/:phoneId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const phoneId = parseInt(req.params.phoneId);
  const { label } = req.body as { label?: string };

  if (isNaN(userId) || isNaN(phoneId)) return res.status(400).json({ error: "bad_request", message: "Invalid ID." });

  const [phone] = await db.select().from(phoneNumbersTable).where(
    and(eq(phoneNumbersTable.id, phoneId), eq(phoneNumbersTable.userId, userId))
  );
  if (!phone) return res.status(404).json({ error: "not_found", message: "Phone number not found." });

  const [updated] = await db.update(phoneNumbersTable)
    .set({ label: label?.trim() || null })
    .where(eq(phoneNumbersTable.id, phoneId))
    .returning();

  res.json(updated);
});

// DELETE /api/users/:userId/phones/:phoneId — remove a secondary number
router.delete("/:phoneId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const phoneId = parseInt(req.params.phoneId);

  if (isNaN(userId) || isNaN(phoneId)) return res.status(400).json({ error: "bad_request", message: "Invalid ID." });

  const [phone] = await db.select().from(phoneNumbersTable).where(
    and(eq(phoneNumbersTable.id, phoneId), eq(phoneNumbersTable.userId, userId))
  );
  if (!phone) return res.status(404).json({ error: "not_found", message: "Phone number not found." });

  await db.delete(phoneNumbersTable).where(eq(phoneNumbersTable.id, phoneId));
  res.json({ success: true });
});

export default router;
