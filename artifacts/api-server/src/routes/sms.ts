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
import { sendSms, normalizeE164, isConfigured } from "../lib/signalwire.js";

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

router.get("/status", (_req, res) => {
  res.json({
    configured: isConfigured(),
    provider: "SignalWire",
    spaceUrl: process.env.SIGNALWIRE_SPACE_URL || null,
    fromNumber: process.env.SIGNALWIRE_PHONE_NUMBER || null,
  });
});

// SignalWire inbound webhook (LaML/TwiML-compatible)
router.post("/webhook", async (req, res) => {
  try {
    const from: string = req.body?.From || req.body?.from || "";
    const body: string = req.body?.Body || req.body?.body || "";

    if (!from || !body) {
      res.status(200).send("<Response></Response>");
      return;
    }

    const cmd = body.trim().toUpperCase();
    const normalizedPhone = normalizeE164(from);
    const digitsOnly = from.replace(/\D/g, "").replace(/^1/, "");

    // Find user by phone
    const allUsers = await db.select().from(usersTable);
    const user = allUsers.find((u) => {
      const uDigits = u.phoneNumber.replace(/\D/g, "").replace(/^1/, "");
      return uDigits === digitsOnly;
    });

    if (!user) {
      console.warn(`[SMS Webhook] Unknown number: ${from}`);
      res.status(200).send("<Response></Response>");
      return;
    }

    if (user.optedOut && cmd !== "START") {
      res.status(200).send("<Response></Response>");
      return;
    }

    // Log inbound
    await db.insert(smsLogsTable).values({
      userId: user.id,
      phoneNumber: from,
      direction: "inbound",
      message: body,
      command: cmd.split(" ")[0],
      status: "delivered",
    });

    // Get enrollment for live Teller data
    const [enrollment] = await db
      .select()
      .from(tellerEnrollmentsTable)
      .where(eq(tellerEnrollmentsTable.userId, user.id))
      .limit(1);

    let responseText = "";

    if (cmd === "START") {
      await db.update(usersTable).set({ optedOut: false }).where(eq(usersTable.id, user.id));
      responseText = "Welcome back to TextBank! You're now subscribed. Reply HELP for commands.";
    } else if (cmd === "HELP") {
      responseText = "TextBank Commands:\nBAL - All balances\nBAL [nickname] - Specific account\nTRANS - Recent 5 transactions\nSTOP - Opt out\nReply HELP for this menu";
    } else if (cmd === "STOP") {
      await db.update(usersTable).set({ optedOut: true, onboardingStatus: "opted_out" }).where(eq(usersTable.id, user.id));
      responseText = "You've been unsubscribed from TextBank SMS. Reply START to re-subscribe.";
    } else if (cmd === "BAL" || cmd.startsWith("BAL ")) {
      responseText = await handleBalance(cmd, user.id, enrollment?.accessToken);
    } else if (cmd === "TRANS") {
      responseText = await handleTransactions(user.id, enrollment?.accessToken);
    } else {
      responseText = "Unknown command. Reply HELP for available commands.";
    }

    // Send real SMS reply
    let smsSid: string | null = null;
    try {
      if (normalizedPhone) {
        const result = await sendSms(normalizedPhone, responseText);
        smsSid = result?.sid ?? null;
      }
    } catch (sendErr) {
      console.error("[SMS Webhook] Failed to send reply:", sendErr instanceof Error ? sendErr.message : sendErr);
    }

    // Log outbound
    await db.insert(smsLogsTable).values({
      userId: user.id,
      phoneNumber: from,
      direction: "outbound",
      message: responseText,
      command: null,
      status: smsSid ? "sent" : "failed",
    });

    // Respond with empty LaML so SignalWire doesn't auto-reply
    res.status(200).set("Content-Type", "text/xml").send("<Response></Response>");
  } catch (err) {
    console.error("[SMS Webhook] Error:", err instanceof Error ? err.message : err);
    res.status(200).send("<Response></Response>");
  }
});

// Simulate SMS (for testing via dashboard — still sends real SMS if configured)
router.post("/simulate", async (req, res) => {
  try {
    const body = SimulateSmsBody.parse(req.body);
    const { userId, command } = body;
    const cmd = command.trim().toUpperCase();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }

    // Log inbound
    await db.insert(smsLogsTable).values({
      userId,
      phoneNumber: user.phoneNumber,
      direction: "inbound",
      message: command,
      command: cmd.split(" ")[0],
      status: "delivered",
    });

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
      responseText = "You've been unsubscribed from TextBank SMS. Reply START to re-subscribe.";
    } else if (cmd === "BAL" || cmd.startsWith("BAL ")) {
      responseText = await handleBalance(cmd, userId, enrollment?.accessToken);
    } else if (cmd === "TRANS") {
      responseText = await handleTransactions(userId, enrollment?.accessToken);
    } else {
      responseText = "Unknown command. Reply HELP for available commands.";
    }

    // Send real SMS if configured
    let smsSid: string | null = null;
    try {
      const normalizedTo = normalizeE164(user.phoneNumber);
      if (normalizedTo) {
        const result = await sendSms(normalizedTo, responseText);
        smsSid = result?.sid ?? null;
      }
    } catch (sendErr) {
      console.error("[SMS Simulate] Send error:", sendErr instanceof Error ? sendErr.message : sendErr);
    }

    const [outboundLog] = await db.insert(smsLogsTable).values({
      userId,
      phoneNumber: user.phoneNumber,
      direction: "outbound",
      message: responseText,
      command: null,
      status: smsSid ? "sent" : isConfigured() ? "failed" : "simulated",
    }).returning();

    res.json({
      command: cmd,
      response: responseText,
      logId: outboundLog.id,
      smsSent: !!smsSid,
      smsSid,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "SMS simulation failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

async function handleBalance(cmd: string, userId: number, accessToken?: string): Promise<string> {
  const nickname = cmd.startsWith("BAL ") ? cmd.slice(4).trim().toLowerCase() : null;

  if (accessToken) {
    try {
      const allEnrollments = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));
      const allTellerAccounts = (
        await Promise.allSettled(allEnrollments.map((e) => listAccounts(e.accessToken)))
      )
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof listAccounts>>> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      const enrollmentMap = new Map(allEnrollments.map((e) => [e.enrollmentId, e.accessToken]));

      if (allTellerAccounts.length === 0) {
        return "No accounts found. Please visit our website to re-link your bank.";
      }

      const targetAccounts = nickname
        ? allTellerAccounts.filter((a) =>
            a.name.toLowerCase().includes(nickname) ||
            a.subtype.toLowerCase().includes(nickname) ||
            a.last_four.includes(nickname)
          )
        : allTellerAccounts;

      if (nickname && targetAccounts.length === 0) {
        return `No account matching "${nickname}". Reply BAL to see all accounts.`;
      }

      const lines = await Promise.all(
        targetAccounts.map(async (acct) => {
          const token = enrollmentMap.get(acct.enrollment_id) ?? accessToken;
          try {
            const bal = await getBalance(token, acct.id);
            const amount = parseFloat(bal.available ?? bal.ledger ?? "0");
            return `${acct.institution.name} ${acct.subtype} ••••${acct.last_four}: $${amount.toFixed(2)}`;
          } catch {
            return `${acct.institution.name} ••••${acct.last_four}: unavailable`;
          }
        })
      );
      return `TextBank Balances:\n${lines.join("\n")}`;
    } catch {
      // fall through to DB
    }
  }

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  if (accounts.length === 0) {
    return "No accounts linked. Visit our website to link a bank account.";
  }
  const target = nickname ? accounts.filter((a) => a.nickname.toLowerCase() === nickname) : accounts;
  if (nickname && target.length === 0) {
    return `No account with nickname "${nickname}". Reply BAL to see all.`;
  }
  const lines = target.map(
    (a) => `${a.nickname} (${a.accountType} ••••${a.accountLastFour}): $${Number(a.currentBalance).toFixed(2)}`
  );
  return `TextBank Balances:\n${lines.join("\n")}`;
}

async function handleTransactions(userId: number, accessToken?: string): Promise<string> {
  if (accessToken) {
    try {
      const allEnrollments = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));
      const firstGoodEnrollment = allEnrollments[0];
      if (!firstGoodEnrollment) throw new Error("no enrollment");

      const tellerAccounts = await listAccounts(firstGoodEnrollment.accessToken);
      if (tellerAccounts.length === 0) {
        return "No accounts linked. Visit our website to re-link your bank.";
      }

      const primary = tellerAccounts[0];
      const txns = await listTransactions(firstGoodEnrollment.accessToken, primary.id, 5);
      if (txns.length === 0) return "No recent transactions found.";

      const lines = txns.map((t) => {
        const amount = parseFloat(t.amount);
        const sign = amount < 0 ? "" : "+";
        const name = t.details?.counterparty?.name || t.description;
        const date = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${date} ${name}: ${sign}$${Math.abs(amount).toFixed(2)}`;
      });

      return `Recent Transactions (${primary.name}):\n${lines.join("\n")}`;
    } catch {
      // fall through to DB
    }
  }

  const txns = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.transactionDate))
    .limit(5);

  if (txns.length === 0) return "No recent transactions found.";

  const lines = txns.map((t) => {
    const sign = t.type === "debit" ? "-" : "+";
    const date = new Date(t.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${date} ${t.merchantName}: ${sign}$${Number(t.amount).toFixed(2)}`;
  });
  return `Recent Transactions:\n${lines.join("\n")}`;
}

export default router;
