import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { smsLogsTable, usersTable, accountsTable, transactionsTable } from "@workspace/db/schema";
import { SimulateSmsBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/logs", async (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
  const limit = parseInt((req.query.limit as string) || "50") || 50;

  let rows;
  if (userId) {
    rows = await db.select().from(smsLogsTable)
      .where(eq(smsLogsTable.userId, userId))
      .orderBy(desc(smsLogsTable.createdAt))
      .limit(limit);
  } else {
    rows = await db.select().from(smsLogsTable)
      .orderBy(desc(smsLogsTable.createdAt))
      .limit(limit);
  }

  res.json(rows);
});

router.post("/simulate", async (req, res) => {
  try {
    const body = SimulateSmsBody.parse(req.body);
    const { userId, command } = body;
    const cmd = command.trim().toUpperCase();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    // Log inbound command
    const [inboundLog] = await db.insert(smsLogsTable).values({
      userId,
      phoneNumber: user.phoneNumber,
      direction: "inbound",
      message: command,
      command: cmd.split(" ")[0],
      status: "delivered",
    }).returning();

    let responseText = "";
    const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));

    if (cmd === "HELP") {
      responseText = "SMS Banking Commands:\nBAL - Check all balances\nBAL [nickname] - Check specific account\nTRANS - Recent transactions\nSTOP - Opt out\nReply HELP for this message";
    } else if (cmd === "STOP") {
      await db.update(usersTable).set({ optedOut: true, onboardingStatus: "opted_out" }).where(eq(usersTable.id, userId));
      responseText = "You have been unsubscribed from SMS Banking. Reply START to re-subscribe.";
    } else if (cmd === "BAL") {
      if (accounts.length === 0) {
        responseText = "No accounts linked. Please visit our website to link a bank account.";
      } else {
        const lines = accounts.map((a) => `${a.nickname} (${a.accountType} ••••${a.accountLastFour}): $${Number(a.currentBalance).toFixed(2)}`);
        responseText = "Current Balances:\n" + lines.join("\n");
      }
    } else if (cmd.startsWith("BAL ")) {
      const nickname = cmd.slice(4).trim().toLowerCase();
      const account = accounts.find((a) => a.nickname.toLowerCase() === nickname);
      if (!account) {
        responseText = `No account found with nickname "${nickname}". Reply BAL to see all accounts.`;
      } else {
        responseText = `${account.nickname} (${account.accountType} ••••${account.accountLastFour}): $${Number(account.currentBalance).toFixed(2)}`;
      }
    } else if (cmd === "TRANS") {
      if (accounts.length === 0) {
        responseText = "No accounts linked. Please visit our website to link a bank account.";
      } else {
        const txns = await db.select().from(transactionsTable)
          .where(eq(transactionsTable.userId, userId))
          .orderBy(desc(transactionsTable.transactionDate))
          .limit(5);

        if (txns.length === 0) {
          responseText = "No recent transactions found.";
        } else {
          const lines = txns.map((t) => {
            const sign = t.type === "debit" ? "-" : "+";
            const date = new Date(t.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return `${date} ${t.merchantName}: ${sign}$${Number(t.amount).toFixed(2)}`;
          });
          responseText = "Recent Transactions:\n" + lines.join("\n");
        }
      }
    } else {
      responseText = "Unknown command. Reply HELP for a list of available commands.";
    }

    // Log outbound response
    const [outboundLog] = await db.insert(smsLogsTable).values({
      userId,
      phoneNumber: user.phoneNumber,
      direction: "outbound",
      message: responseText,
      command: null,
      status: "delivered",
    }).returning();

    res.json({
      command: cmd,
      response: responseText,
      logId: outboundLog.id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "SMS simulation failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

export default router;
