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
      responseText = "TextBank Commands:\nBAL - All balances\nBAL [nick] - One account\nTRANS - Last 5 transactions\nTRANS [n] - Last N transactions\nLAST - Most recent transaction\nLIMIT - Credit card limits\nSPEND - Monthly spend total\nSTOP - Opt out\nSTART - Re-subscribe";
    } else if (cmd === "STOP") {
      await db.update(usersTable).set({ optedOut: true, onboardingStatus: "opted_out" }).where(eq(usersTable.id, user.id));
      responseText = "You've been unsubscribed from TextBank SMS. Reply START to re-subscribe.";
    } else if (cmd === "BAL" || cmd.startsWith("BAL ")) {
      responseText = await handleBalance(cmd, user.id, enrollment?.accessToken);
    } else if (cmd === "TRANS" || cmd.startsWith("TRANS ")) {
      responseText = await handleTransactions(cmd, user.id, enrollment?.accessToken);
    } else if (cmd === "LAST") {
      responseText = await handleLastTransaction(user.id, enrollment?.accessToken);
    } else if (cmd === "LIMIT") {
      responseText = await handleCreditLimit(user.id, enrollment?.accessToken);
    } else if (cmd === "SPEND") {
      responseText = await handleSpend(user.id, enrollment?.accessToken);
    } else {
      responseText = "Unknown command. Reply HELP for available commands.";
    }

    // Log outbound
    await db.insert(smsLogsTable).values({
      userId: user.id,
      phoneNumber: from,
      direction: "outbound",
      message: responseText,
      command: null,
      status: "sent",
    });

    // Respond with cXML Message — SignalWire delivers it directly (no REST API needed)
    const escaped = responseText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    res.status(200).set("Content-Type", "text/xml").send(
      `<Response><Message>${escaped}</Message></Response>`
    );
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
      responseText = "TextBank Commands:\nBAL - All balances\nBAL [nick] - One account\nTRANS - Last 5 transactions\nTRANS [n] - Last N transactions\nLAST - Most recent transaction\nLIMIT - Credit card limits\nSPEND - Monthly spend total\nSTOP - Opt out\nSTART - Re-subscribe";
    } else if (cmd === "STOP") {
      await db.update(usersTable).set({ optedOut: true, onboardingStatus: "opted_out" }).where(eq(usersTable.id, userId));
      responseText = "You've been unsubscribed from TextBank SMS. Reply START to re-subscribe.";
    } else if (cmd === "BAL" || cmd.startsWith("BAL ")) {
      responseText = await handleBalance(cmd, userId, enrollment?.accessToken);
    } else if (cmd === "TRANS" || cmd.startsWith("TRANS ")) {
      responseText = await handleTransactions(cmd, userId, enrollment?.accessToken);
    } else if (cmd === "LAST") {
      responseText = await handleLastTransaction(userId, enrollment?.accessToken);
    } else if (cmd === "LIMIT") {
      responseText = await handleCreditLimit(userId, enrollment?.accessToken);
    } else if (cmd === "SPEND") {
      responseText = await handleSpend(userId, enrollment?.accessToken);
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

async function handleTransactions(cmd: string, userId: number, accessToken?: string): Promise<string> {
  const arg = cmd.startsWith("TRANS ") ? cmd.slice(6).trim() : "";
  const countArg = parseInt(arg);
  const count = !isNaN(countArg) && countArg > 0 ? Math.min(countArg, 10) : 5;

  if (accessToken) {
    try {
      const allEnrollments = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));
      const firstGoodEnrollment = allEnrollments[0];
      if (!firstGoodEnrollment) throw new Error("no enrollment");

      const tellerAccounts = await listAccounts(firstGoodEnrollment.accessToken);
      if (tellerAccounts.length === 0) {
        return "No accounts linked. Visit our website to re-link your bank.";
      }

      // If arg is a non-number, try to match an account
      const targetAccount = (!isNaN(countArg) || arg === "")
        ? tellerAccounts[0]
        : tellerAccounts.find((a) =>
            a.name.toLowerCase().includes(arg.toLowerCase()) ||
            a.subtype.toLowerCase().includes(arg.toLowerCase()) ||
            a.last_four.includes(arg)
          ) ?? tellerAccounts[0];

      const txns = await listTransactions(firstGoodEnrollment.accessToken, targetAccount.id, count);
      if (txns.length === 0) return "No recent transactions found.";

      const lines = txns.map((t) => {
        const amount = parseFloat(t.amount);
        const sign = t.type === "credit" ? "+" : "-";
        const name = t.details?.counterparty?.name || t.description;
        const date = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${date} ${name}: ${sign}$${Math.abs(amount).toFixed(2)}`;
      });

      return `Transactions (${targetAccount.name}):\n${lines.join("\n")}`;
    } catch {
      // fall through to DB
    }
  }

  const txns = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.transactionDate))
    .limit(count);

  if (txns.length === 0) return "No transactions on record. Try syncing your account at textbanks.com.";

  const lines = txns.map((t) => {
    const sign = t.type === "debit" ? "-" : "+";
    const date = new Date(t.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${date} ${t.merchantName}: ${sign}$${Number(t.amount).toFixed(2)}`;
  });
  return `Recent Transactions:\n${lines.join("\n")}`;
}

async function handleLastTransaction(userId: number, accessToken?: string): Promise<string> {
  if (accessToken) {
    try {
      const [enrollment] = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));
      if (!enrollment) throw new Error("no enrollment");

      const accounts = await listAccounts(enrollment.accessToken);
      if (accounts.length === 0) return "No accounts linked.";

      const txns = await listTransactions(enrollment.accessToken, accounts[0].id, 1);
      if (txns.length === 0) return "No transactions found.";

      const t = txns[0];
      const amount = parseFloat(t.amount);
      const sign = t.type === "credit" ? "+" : "-";
      const name = t.details?.counterparty?.name || t.description;
      const date = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const cat = t.details?.category ? ` (${t.details.category})` : "";
      return `Last Transaction:\n${date} ${name}: ${sign}$${Math.abs(amount).toFixed(2)}${cat}`;
    } catch {
      // fall through
    }
  }

  const [txn] = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.transactionDate))
    .limit(1);

  if (!txn) return "No transactions on record. Try syncing at textbanks.com.";
  const sign = txn.type === "debit" ? "-" : "+";
  const date = new Date(txn.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Last Transaction:\n${date} ${txn.merchantName}: ${sign}$${Number(txn.amount).toFixed(2)}`;
}

async function handleCreditLimit(userId: number, accessToken?: string): Promise<string> {
  if (accessToken) {
    try {
      const allEnrollments = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));

      const allAccounts = (
        await Promise.allSettled(allEnrollments.map((e) => listAccounts(e.accessToken)))
      )
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof listAccounts>>> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      const creditAccounts = allAccounts.filter((a) =>
        a.type === "credit" || a.subtype === "credit_card"
      );

      if (creditAccounts.length === 0) {
        return "No credit card accounts found. Reply BAL for all account balances.";
      }

      const enrollmentMap = new Map(allEnrollments.map((e) => [e.enrollmentId, e.accessToken]));

      const lines = await Promise.all(
        creditAccounts.map(async (acct) => {
          const token = enrollmentMap.get(acct.enrollment_id) ?? accessToken;
          try {
            const bal = await getBalance(token, acct.id);
            const owed = parseFloat(bal.ledger ?? "0");
            const available = parseFloat(bal.available ?? "0");
            const limit = owed + available;
            return `${acct.institution.name} ••••${acct.last_four}:\nOwed: $${owed.toFixed(2)}\nAvailable: $${available.toFixed(2)}\nLimit: $${limit.toFixed(2)}`;
          } catch {
            return `${acct.institution.name} ••••${acct.last_four}: unavailable`;
          }
        })
      );

      return `Credit Card Info:\n${lines.join("\n---\n")}`;
    } catch {
      // fall through
    }
  }

  const accounts = await db.select().from(accountsTable)
    .where(eq(accountsTable.userId, userId));
  const creditAccounts = accounts.filter((a) => a.accountType === "credit");

  if (creditAccounts.length === 0) {
    return "No credit card accounts found. Reply BAL for all account balances.";
  }

  const lines = creditAccounts.map((a) =>
    `${a.bankName} ••••${a.accountLastFour}: $${Number(a.currentBalance).toFixed(2)} owed`
  );
  return `Credit Cards:\n${lines.join("\n")}`;
}

async function handleSpend(userId: number, accessToken?: string): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  if (accessToken) {
    try {
      const allEnrollments = await db.select().from(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.userId, userId));
      const firstEnrollment = allEnrollments[0];
      if (!firstEnrollment) throw new Error("no enrollment");

      const accounts = await listAccounts(firstEnrollment.accessToken);
      if (accounts.length === 0) return "No accounts linked.";

      let totalSpend = 0;
      const categoryTotals = new Map<string, number>();

      await Promise.all(
        accounts.map(async (acct) => {
          const txns = await listTransactions(firstEnrollment.accessToken, acct.id, 50);
          for (const t of txns) {
            if (t.type !== "debit") continue;
            if (new Date(t.date) < monthStart) continue;
            const amount = Math.abs(parseFloat(t.amount));
            totalSpend += amount;
            const cat = t.details?.category || "other";
            categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + amount);
          }
        })
      );

      if (totalSpend === 0) return `${monthName} Spending: $0.00 so far.`;

      const topCats = [...categoryTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`);

      return `${monthName} Spending:\nTotal: $${totalSpend.toFixed(2)}\nTop categories:\n${topCats.join("\n")}`;
    } catch {
      // fall through
    }
  }

  const txns = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const monthTxns = txns.filter((t) => t.type === "debit" && new Date(t.transactionDate) >= monthStart);
  if (monthTxns.length === 0) return `${monthName} Spending: No debit transactions on record.`;

  const total = monthTxns.reduce((sum, t) => sum + Number(t.amount), 0);
  const catMap = new Map<string, number>();
  for (const t of monthTxns) {
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + Number(t.amount));
  }
  const topCats = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`);

  return `${monthName} Spending:\nTotal: $${total.toFixed(2)}\nTop categories:\n${topCats.join("\n")}`;
}

export default router;
