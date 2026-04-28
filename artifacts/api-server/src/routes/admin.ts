import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable, smsLogsTable } from "@workspace/db/schema";
import { count, sql } from "drizzle-orm";
import { requireAdmin, signSessionToken, verifySessionToken } from "../middleware/auth.js";
import { eq, count, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { createRouteLimiter, enforceRetryLockout, recordRetryFailure, clearRetryFailures, retryPolicies } from "../middleware/security.js";

const router: IRouter = Router();

const adminLoginLimiter = createRouteLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many admin login attempts. Please wait and try again.",
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "textbanks-admin-2025";

router.post("/login", adminLoginLimiter, (req, res) => {
  const { password } = req.body as { password?: string };
  const subject = "admin";

  if (enforceRetryLockout(req, res, retryPolicies.adminLogin, subject)) {
    return;
  }

  if (!password) {
    recordRetryFailure(req, retryPolicies.adminLogin, subject);
    return res.status(400).json({ error: "bad_request", message: "Password is required." });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "unauthorized", message: "Unauthorized" });
  }

  const token = signSessionToken({ userId: 0, role: "admin" });
  res.json({ token });
    recordRetryFailure(req, retryPolicies.adminLogin, subject);
    return res.status(401).json({ error: "unauthorized", message: "Invalid credentials." });
  }

  clearRetryFailures(req, retryPolicies.adminLogin, subject);
  res.json({ token: VALID_TOKEN });
});

router.post("/verify-token", (req, res) => {
  const { token } = req.body as { token?: string };
  const payload = token ? verifySessionToken(token) : null;
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "unauthorized", message: "Unauthorized" });
  }
  res.json({ valid: true });
});

router.use(requireAdmin);

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
