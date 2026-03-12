import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, accountsTable, smsLogsTable } from "@workspace/db/schema";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

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
