import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tellerEnrollmentsTable,
  accountsTable,
  transactionsTable,
  usersTable,
} from "@workspace/db/schema";
import { TellerEnrollBody } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import {
  listAccounts,
  getBalance,
  listTransactions,
  getTellerAppId,
  type TellerAccount,
} from "../lib/teller.js";
import { encryptTellerAccessToken, decryptTellerAccessToken } from "../lib/security.js";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  const appId = getTellerAppId();
  if (!appId) {
    return res.status(503).json({ error: "not_configured", message: "Teller is not configured" });
  }
  const environment = (process.env.TELLER_ENVIRONMENT as "sandbox" | "development" | "production") ?? "sandbox";
  res.json({
    applicationId: appId,
    environment,
  });
});

async function syncAccountsForEnrollment(
  userId: number,
  accessToken: string
): Promise<{ linked: number; accounts: unknown[] }> {
  const tellerAccounts = await listAccounts(accessToken);

  const saved = [];
  for (const acct of tellerAccounts) {
    let balance = 0;
    try {
      const bal = await getBalance(accessToken, acct.id);
      balance = parseFloat(bal.available ?? bal.ledger ?? "0");
    } catch {
      balance = 0;
    }

    const [row] = await db
      .insert(accountsTable)
      .values({
        userId,
        tellerAccountId: acct.id,
        bankName: acct.institution.name,
        accountType: normalizeAccountType(acct.type, acct.subtype),
        accountLastFour: acct.last_four,
        nickname: buildNickname(acct),
        currentBalance: String(balance),
      })
      .onConflictDoUpdate({
        target: [accountsTable.userId, accountsTable.tellerAccountId],
        set: {
          bankName: acct.institution.name,
          accountType: normalizeAccountType(acct.type, acct.subtype),
          accountLastFour: acct.last_four,
          nickname: buildNickname(acct),
          currentBalance: String(balance),
        },
      })
      .returning();

    saved.push({ ...row, currentBalance: Number(row.currentBalance) });
  }

  return { linked: saved.length, accounts: saved };
}

router.post("/enroll", async (req, res) => {
  try {
    const body = TellerEnrollBody.parse(req.body);
    const { userId, accessToken, enrollmentId, institutionName } = body;

    const encryptedToken = encryptTellerAccessToken(accessToken);
    await db
      .insert(tellerEnrollmentsTable)
      .values({
        userId,
        enrollmentId,
        accessToken: "__encrypted__",
        accessTokenCiphertext: encryptedToken.ciphertext,
        accessTokenCiphertextIv: encryptedToken.ciphertextIv,
        accessTokenCiphertextTag: encryptedToken.ciphertextTag,
        accessTokenWrappedDek: encryptedToken.wrappedDek,
        accessTokenWrappedDekIv: encryptedToken.wrappedDekIv,
        accessTokenWrappedDekTag: encryptedToken.wrappedDekTag,
        institutionName,
      })
      .onConflictDoNothing();

    let result: { linked: number; accounts: unknown[] };
    try {
      result = await syncAccountsForEnrollment(userId, accessToken);
    } catch (fetchErr) {
      const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[Teller] Failed to sync accounts after enrollment:", detail);
      await db.update(usersTable).set({ onboardingStatus: "bank_linked" }).where(eq(usersTable.id, userId));
      return res.json({
        success: true,
        accountsLinked: 0,
        accounts: [],
        warning: "Bank linked but account sync failed. You can retry syncing from your account dashboard.",
      });
    }

    await db.update(usersTable).set({ onboardingStatus: "active" }).where(eq(usersTable.id, userId));

    res.json({
      success: true,
      accountsLinked: result.linked,
      accounts: result.accounts,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Enrollment failed";
    console.error("[Teller] Enrollment error:", message);
    res.status(400).json({ error: "enroll_failed", message });
  }
});

router.post("/sync/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const enrollments = await db
    .select()
    .from(tellerEnrollmentsTable)
    .where(eq(tellerEnrollmentsTable.userId, userId));

  if (enrollments.length === 0) {
    return res.status(404).json({ error: "not_found", message: "No bank connections found for this user" });
  }

  let totalLinked = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments) {
    try {
      const { linked } = await syncAccountsForEnrollment(userId, decryptTellerAccessToken(enrollment));
      totalLinked += linked;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Teller] Sync failed for enrollment ${enrollment.enrollmentId}:`, msg);
      errors.push(`${enrollment.institutionName}: ${msg}`);
    }
  }

  if (totalLinked > 0) {
    await db.update(usersTable).set({ onboardingStatus: "active" }).where(eq(usersTable.id, userId));
  }

  res.json({
    success: true,
    accountsLinked: totalLinked,
    errors: errors.length > 0 ? errors : undefined,
  });
});

router.get("/accounts/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const enrollments = await db
    .select()
    .from(tellerEnrollmentsTable)
    .where(eq(tellerEnrollmentsTable.userId, userId));

  if (enrollments.length === 0) {
    return res.status(404).json({ error: "not_found", message: "No Teller enrollment found for this user" });
  }

  const results = await Promise.allSettled(
    enrollments.map(async (enrollment) => {
      const tellerAccounts = await listAccounts(decryptTellerAccessToken(enrollment));
      return Promise.all(
        tellerAccounts.map(async (acct) => {
          let availableBalance: number | null = null;
          let ledgerBalance: number | null = null;
          try {
            const bal = await getBalance(decryptTellerAccessToken(enrollment), acct.id);
            availableBalance = parseFloat(bal.available);
            ledgerBalance = parseFloat(bal.ledger);
          } catch {
            // balance unavailable
          }
          return {
            id: acct.id,
            name: acct.name,
            type: acct.type,
            subtype: acct.subtype,
            lastFour: acct.last_four,
            institutionName: acct.institution.name,
            availableBalance,
            ledgerBalance,
            status: acct.status,
          };
        })
      );
    })
  );

  const allAccounts = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof listAccounts>>> =>
      r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  const failedCount = results.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    console.warn(`[Teller] /accounts/${userId}: ${failedCount}/${enrollments.length} enrollments failed to fetch`);
  }

  if (allAccounts.length === 0 && failedCount === enrollments.length) {
    return res.status(502).json({ error: "teller_error", message: "All bank connections failed to respond. Please reconnect your bank." });
  }

  res.json(allAccounts.flat());
});

router.post("/sync-transactions/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const enrollments = await db
    .select()
    .from(tellerEnrollmentsTable)
    .where(eq(tellerEnrollmentsTable.userId, userId));

  if (enrollments.length === 0) {
    return res.json({ success: true, synced: 0, message: "No bank connections found" });
  }

  let totalSynced = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments) {
    try {
      const tellerAccounts = await listAccounts(decryptTellerAccessToken(enrollment));

      for (const acct of tellerAccounts) {
        const dbAccount = await db
          .select({ id: accountsTable.id })
          .from(accountsTable)
          .where(and(
            eq(accountsTable.userId, userId),
            eq(accountsTable.tellerAccountId, acct.id)
          ))
          .limit(1);

        if (dbAccount.length === 0) continue;
        const accountId = dbAccount[0].id;

        const txns = await listTransactions(decryptTellerAccessToken(enrollment), acct.id, 25);

        if (txns.length === 0) continue;

        await db.delete(transactionsTable).where(
          and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.accountId, accountId)
          )
        );

        const rows = txns.map((t) => ({
          accountId,
          userId,
          description: t.description,
          amount: String(Math.abs(parseFloat(t.amount))),
          type: t.type,
          category: t.details?.category || "other",
          merchantName: t.details?.counterparty?.name || t.description,
          transactionDate: new Date(t.date),
          runningBalance: String(parseFloat(t.running_balance || "0")),
        }));

        await db.insert(transactionsTable).values(rows);
        totalSynced += rows.length;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[Teller] Transaction sync failed for enrollment ${enrollment.enrollmentId}:`, msg);
      errors.push(`${enrollment.institutionName}: ${msg}`);
    }
  }

  res.json({
    success: true,
    synced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  });
});

function normalizeAccountType(type: string, subtype: string): "checking" | "savings" | "credit" {
  const t = (type + " " + subtype).toLowerCase();
  if (t.includes("credit")) return "credit";
  if (t.includes("savings")) return "savings";
  return "checking";
}

function buildNickname(acct: Pick<TellerAccount, "name" | "subtype" | "last_four">): string {
  const base = acct.subtype || acct.name.split(" ")[0];
  return base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || `acct${acct.last_four}`;
}

export default router;
