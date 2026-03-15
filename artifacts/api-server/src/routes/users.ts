import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, smsLogsTable, accountsTable } from "@workspace/db/schema";
import { RegisterUserBody, ListUsersResponse, GetUserResponse } from "@workspace/api-zod";
import { eq, desc, max } from "drizzle-orm";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  try {
    const body = RegisterUserBody.parse(req.body);

    const [user] = await db.insert(usersTable).values({
      phoneNumber: body.phoneNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      smsConsent: body.smsConsent,
      consentDate: body.smsConsent ? new Date() : null,
      optedOut: false,
      onboardingStatus: "pending",
    }).returning();

    res.status(201).json(user);
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    const causeErr = err?.cause as Record<string, unknown> | undefined;
    const pgCode = err?.code || causeErr?.code;
    const msgStr = String(err?.message || "");

    if (pgCode === "23505" || msgStr.includes("23505") || msgStr.includes("unique")) {
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

  ListUsersResponse.parse(result);
  res.json(result);
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

  GetUserResponse.parse(result);
  res.json(result);
});

export default router;
