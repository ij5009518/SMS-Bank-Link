import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { accountsTable, usersTable } from "@workspace/db/schema";
import { LinkAccountBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { requireAuth, requireSelf, getAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = LinkAccountBody.parse(req.body);

    const auth = getAuth(req)!;
    if (auth.role !== "admin" && auth.sub !== body.userId) {
      return res.status(403).json({ error: "forbidden", message: "You can only link accounts to your own profile." });
    }

    const [account] = await db.insert(accountsTable).values({
      userId: body.userId,
      bankName: body.bankName,
      accountType: body.accountType,
      accountLastFour: body.accountLastFour,
      nickname: body.nickname,
      currentBalance: String(body.currentBalance),
    }).returning();

    // Update user onboarding status
    await db.update(usersTable)
      .set({ onboardingStatus: "active" })
      .where(eq(usersTable.id, body.userId));

    res.status(201).json({ ...account, currentBalance: Number(account.currentBalance) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Account linking failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

router.get("/:userId", requireAuth, requireSelf(), async (req, res) => {
  const userId = parseInt(String(req.params.userId), 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
  }

  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId));
  res.json(accounts.map((a) => ({ ...a, currentBalance: Number(a.currentBalance) })));
});

export default router;
