import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const limit = parseInt((req.query.limit as string) || "10") || 10;
  const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : null;

  const conditions = [eq(transactionsTable.userId, userId)];
  if (accountId) {
    conditions.push(eq(transactionsTable.accountId, accountId));
  }

  const rows = await db.select().from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.transactionDate))
    .limit(limit);

  res.json(rows.map((t) => ({
    ...t,
    amount: Number(t.amount),
    runningBalance: Number(t.runningBalance),
  })));
});

export default router;
