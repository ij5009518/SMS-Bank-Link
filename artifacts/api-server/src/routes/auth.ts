import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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
  const { passwordHash: _pw, ...rest } = user as typeof user & { passwordHash?: string };
  return { ...rest, accounts };
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
  const { firstName, lastName, phoneNumber, password, smsConsent } = req.body as {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    password?: string;
    smsConsent?: boolean;
  };

  if (!firstName || !lastName || !phoneNumber || !password) {
    return res.status(400).json({ error: "bad_request", message: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "bad_request", message: "Password must be at least 6 characters." });
  }

  const normalized = phoneNumber.replace(/\D/g, "");
  const passwordHash = await hashPassword(password);

  try {
    const [user] = await db.insert(usersTable).values({
      phoneNumber: normalized,
      firstName,
      lastName,
      passwordHash,
      smsConsent: !!smsConsent,
      consentDate: smsConsent ? new Date() : null,
      optedOut: false,
      onboardingStatus: "pending",
    }).returning();

    res.status(201).json(safeUser(user, []));
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    const causeErr = err?.cause as Record<string, unknown> | undefined;
    const pgCode = err?.code || causeErr?.code;
    const msgStr = String(err?.message || "");
    if (pgCode === "23505" || msgStr.includes("23505") || msgStr.includes("unique")) {
      return res.status(409).json({ error: "duplicate_phone", message: "This phone number is already registered. Try signing in instead." });
    }
    const message = e instanceof Error ? e.message : "Sign up failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

export { hashPassword };
export default router;
