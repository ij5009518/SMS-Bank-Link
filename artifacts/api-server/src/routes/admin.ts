import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable, smsLogsTable } from "@workspace/db/schema";
import { count, sql } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { signAdminToken, verifyToken } from "../lib/tokens.js";
import { requireAdmin } from "../middlewares/auth";
import { rateLimit } from "../middlewares/rate-limit";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.warn(
    "[Admin] ADMIN_PASSWORD is not set — the admin dashboard login is disabled until it is configured.",
  );
}

function passwordMatches(provided: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "admin-login" }), (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: "bad_request", message: "Password is required." });
  if (!passwordMatches(password)) {
    return res.status(401).json({ error: "unauthorized", message: "Incorrect admin password." });
  }
  // Short-lived, signed, expiring admin session token.
  res.json({ token: signAdminToken() });
});

router.post("/verify-token", (req, res) => {
  const { token } = req.body as { token?: string };
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired session." });
  }
  res.json({ valid: true });
});

router.get("/stats", requireAdmin, async (_req, res) => {
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
