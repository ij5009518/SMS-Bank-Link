import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  smsLogsTable,
  usersTable,
  accountsTable,
  transactionsTable,
  tellerEnrollmentsTable,
} from "@workspace/db/schema";
import { SimulateSmsBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { listAccounts, getBalance, listTransactions } from "../lib/teller.js";

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
    await db.insert(smsLogsTable).values({
      userId,
      phoneNumber: user.phoneNumber,
      direction: "inbound",
      message: command,
      command: cmd.split(" ")[0],
      status: "delivered",
    });

    // Check for live Teller enrollment
    const [enrollment] = await db
      .select()
      .from(tellerEnrollmentsTable)
      .where(eq(tellerEnrollmentsTable.userId, userId))
      .limit(1);

    let responseText = "";

    if (cmd === "HELP") {
      responseText = "TextBank Commands:\nBAL - All balances\nBAL [nickname] - Specific account\nTRANS - Recent 5 transactions\nSTOP - Opt out\nReply HELP for this menu";
    } else if (cmd === "STOP") {
      await db.update(usersTable).set({ optedOut: true, onboardingStatus: "opted_out" }).where(eq(usersTable.id, userId));
      responseText = "You have been unsubscribed from SMS Banking. Reply START to re-subscribe.";
    } else if (cmd === "BAL" || cmd.startsWith("BAL ")) {
      responseText = await handleBalance(cmd, userId, enrollment?.accessToken);
    } else if (cmd === "TRANS") {
      responseText = await handleTransactions(userId, enrollment?.accessToken);
    } else {
      responseText = "Unknown command. Reply HELP for available commands.";
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

async function handleBalance(cmd: string, userId: number, accessToken?: string): Promise<string> {
  const nickname = cmd.startsWith("BAL ") ? cmd.slice(4).trim().toLowerCase() : null;

  if (accessToken) {
    // Use live Teller data
    try {
      const tellerAccounts = await listAccounts(accessToken);
      if (tellerAccounts.length === 0) {
        return "No accounts found. Please visit our website to re-link your bank.";
      }

      const targetAccounts = nickname
        ? tellerAccounts.filter((a) =>
            a.name.toLowerCase().includes(nickname) ||
            a.subtype.toLowerCase().includes(nickname)
          )
        : tellerAccounts;

      if (nickname && targetAccounts.length === 0) {
        return `No account matching "${nickname}". Reply BAL to see all accounts.`;
      }

      const lines = await Promise.all(
        targetAccounts.map(async (acct) => {
          try {
            const bal = await getBalance(accessToken, acct.id);
            const amount = parseFloat(bal.available ?? bal.ledger ?? "0");
            return `${acct.name} (••••${acct.last_four}): $${amount.toFixed(2)}`;
          } catch {
            return `${acct.name} (••••${acct.last_four}): balance unavailable`;
          }
        })
      );
      return `Live Balances:\n${lines.join("\n")}`;
    } catch {
      // Fall through to DB data on Teller error
    }
  }

  // Fallback: use stored accounts
  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  if (accounts.length === 0) {
    return "No accounts linked. Please visit our website to link a bank account.";
  }

  const target = nickname
    ? accounts.filter((a) => a.nickname.toLowerCase() === nickname)
    : accounts;

  if (nickname && target.length === 0) {
    return `No account found with nickname "${nickname}". Reply BAL to see all accounts.`;
  }

  const lines = target.map(
    (a) => `${a.nickname} (${a.accountType} ••••${a.accountLastFour}): $${Number(a.currentBalance).toFixed(2)}`
  );
  return `Current Balances:\n${lines.join("\n")}`;
}

async function handleTransactions(userId: number, accessToken?: string): Promise<string> {
  if (accessToken) {
    try {
      const tellerAccounts = await listAccounts(accessToken);
      if (tellerAccounts.length === 0) {
        return "No accounts linked. Please visit our website to re-link your bank.";
      }

      // Fetch from first account for now
      const primary = tellerAccounts[0];
      const txns = await listTransactions(accessToken, primary.id, 5);

      if (txns.length === 0) {
        return "No recent transactions found.";
      }

      const lines = txns.map((t) => {
        const amount = parseFloat(t.amount);
        const sign = amount < 0 ? "" : "+";
        const name = t.details?.counterparty?.name || t.description;
        const date = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${date} ${name}: ${sign}$${Math.abs(amount).toFixed(2)}`;
      });

      return `Recent Transactions (${primary.name}):\n${lines.join("\n")}`;
    } catch {
      // Fall through to DB data
    }
  }

  // Fallback: use stored transactions
  const txns = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.transactionDate))
    .limit(5);

  if (txns.length === 0) {
    return "No recent transactions found.";
  }

  const lines = txns.map((t) => {
    const sign = t.type === "debit" ? "-" : "+";
    const date = new Date(t.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${date} ${t.merchantName}: ${sign}$${Number(t.amount).toFixed(2)}`;
  });
  return `Recent Transactions:\n${lines.join("\n")}`;
}

export default router;
