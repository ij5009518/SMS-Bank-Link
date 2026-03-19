import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable, smsLogsTable } from "@workspace/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { createHash } from "crypto";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "textbanks-admin-2025";
// Simple signed token: sha256(password + secret)
const ADMIN_SECRET = process.env.ADMIN_SECRET || "tb_admin_secret_key";
function makeToken(password: string) {
  return createHash("sha256").update(password + ADMIN_SECRET).digest("hex");
}
const VALID_TOKEN = makeToken(ADMIN_PASSWORD);

router.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: "bad_request", message: "Password is required." });
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "unauthorized", message: "Incorrect admin password." });
  }
  res.json({ token: VALID_TOKEN });
});

router.post("/verify-token", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || token !== VALID_TOKEN) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired session." });
  }
  res.json({ valid: true });
});

router.get("/stats", async (_req, res) => {
  const [userStats] = await db.select({
    totalUsers: count(),
    activeUsers: sql<number>`count(*) filter (where ${usersTable.onboardingStatus} = 'active')`,
    optedOutUsers: sql<number>`count(*) filter (where ${usersTable.optedOut} = true)`,
    pendingOnboarding: sql<number>`count(*) filter (where ${usersTable.onboardingStatus} = 'pending')`,
  }).from(usersTable);

  const [accountStats] = await db.select({
    totalAccountsLinked: count(),
  }).from(accountsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [smsStats] = await db.select({
    totalSmsToday: sql<number>`count(*) filter (where ${smsLogsTable.createdAt} >= ${today.toISOString()})`,
  }).from(smsLogsTable);

  res.json({
    totalUsers: Number(userStats.totalUsers),
    activeUsers: Number(userStats.activeUsers),
    optedOutUsers: Number(userStats.optedOutUsers),
    pendingOnboarding: Number(userStats.pendingOnboarding),
    totalAccountsLinked: Number(accountStats.totalAccountsLinked),
    totalSmsToday: Number(smsStats.totalSmsToday),
  });
});

export default router;
