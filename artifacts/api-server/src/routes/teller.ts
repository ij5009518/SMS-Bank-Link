import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tellerEnrollmentsTable,
  accountsTable,
  usersTable,
} from "@workspace/db/schema";
import { TellerEnrollBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import {
  listAccounts,
  getBalance,
  getTellerAppId,
} from "../lib/teller.js";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  const appId = getTellerAppId();
  if (!appId) {
    return res.status(503).json({ error: "not_configured", message: "Teller is not configured" });
  }
  // TELLER_ENVIRONMENT controls the Connect widget environment.
  // Use "sandbox" for testing, "development" for real banks with a dev-approved app,
  // or "production" for a fully approved production app.
  const environment = (process.env.TELLER_ENVIRONMENT as "sandbox" | "development" | "production") ?? "sandbox";
  res.json({
    applicationId: appId,
    environment,
  });
});

router.post("/enroll", async (req, res) => {
  try {
    const body = TellerEnrollBody.parse(req.body);
    const { userId, accessToken, enrollmentId, institutionName } = body;

    await db.insert(tellerEnrollmentsTable).values({
      userId,
      enrollmentId,
      accessToken,
      institutionName,
    }).onConflictDoNothing();

    let tellerAccounts;
    try {
      tellerAccounts = await listAccounts(accessToken);
    } catch (fetchErr) {
      const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[Teller] Failed to list accounts after enrollment:", detail);
      await db.update(usersTable)
        .set({ onboardingStatus: "bank_connected" })
        .where(eq(usersTable.id, userId));
      return res.json({
        success: true,
        accountsLinked: 0,
        accounts: [],
        warning: "Bank connected but account sync failed. Accounts will sync on next login.",
      });
    }

    const linked = [];
    for (const acct of tellerAccounts) {
      let balance = 0;
      try {
        const bal = await getBalance(accessToken, acct.id);
        balance = parseFloat(bal.available ?? bal.ledger ?? "0");
      } catch {
        balance = 0;
      }

      const [saved] = await db.insert(accountsTable).values({
        userId,
        bankName: acct.institution.name,
        accountType: normalizeAccountType(acct.type, acct.subtype),
        accountLastFour: acct.last_four,
        nickname: buildNickname(acct),
        currentBalance: String(balance),
      }).returning();

      linked.push({ ...saved, currentBalance: Number(saved.currentBalance) });
    }

    await db.update(usersTable)
      .set({ onboardingStatus: "active" })
      .where(eq(usersTable.id, userId));

    res.json({
      success: true,
      accountsLinked: linked.length,
      accounts: linked,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Enrollment failed";
    console.error("[Teller] Enrollment error:", message);
    res.status(400).json({ error: "enroll_failed", message });
  }
});

router.get("/accounts/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const [enrollment] = await db
    .select()
    .from(tellerEnrollmentsTable)
    .where(eq(tellerEnrollmentsTable.userId, userId))
    .limit(1);

  if (!enrollment) {
    return res.status(404).json({ error: "not_found", message: "No Teller enrollment found for this user" });
  }

  try {
    const tellerAccounts = await listAccounts(enrollment.accessToken);

    const summaries = await Promise.all(
      tellerAccounts.map(async (acct) => {
        let availableBalance: number | null = null;
        let ledgerBalance: number | null = null;
        try {
          const bal = await getBalance(enrollment.accessToken, acct.id);
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

    res.json(summaries);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch accounts";
    res.status(500).json({ error: "teller_error", message });
  }
});

function normalizeAccountType(type: string, subtype: string): "checking" | "savings" | "credit" {
  const t = (type + " " + subtype).toLowerCase();
  if (t.includes("credit")) return "credit";
  if (t.includes("savings")) return "savings";
  return "checking";
}

function buildNickname(acct: { name: string; subtype: string; last_four: string }): string {
  const base = acct.subtype || acct.name.split(" ")[0];
  return base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || `acct${acct.last_four}`;
}

export default router;
