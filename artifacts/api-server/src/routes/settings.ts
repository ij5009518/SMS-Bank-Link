import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alertSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { UpdateAlertSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const rows = await db.select().from(alertSettingsTable).limit(1);
  if (rows.length > 0) return rows[0];

  const [created] = await db.insert(alertSettingsTable).values({
    alertsEnabled: true,
    weekendPauseEnabled: true,
    weekendPauseStart: "friday_14:00",
    weekendPauseEnd: "sunday_00:00",
    maxDailyAlerts: 10,
    lowBalanceThreshold: "100",
    largeTransactionThreshold: "500",
  }).returning();
  return created;
}

router.get("/alerts", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json({
    ...settings,
    lowBalanceThreshold: Number(settings.lowBalanceThreshold),
    largeTransactionThreshold: Number(settings.largeTransactionThreshold),
  });
});

router.put("/alerts", async (req, res) => {
  try {
    const body = UpdateAlertSettingsBody.parse(req.body);
    const settings = await getOrCreateSettings();

    const [updated] = await db.update(alertSettingsTable)
      .set({
        alertsEnabled: body.alertsEnabled,
        weekendPauseEnabled: body.weekendPauseEnabled,
        weekendPauseStart: body.weekendPauseStart,
        weekendPauseEnd: body.weekendPauseEnd,
        maxDailyAlerts: body.maxDailyAlerts,
        lowBalanceThreshold: String(body.lowBalanceThreshold),
        largeTransactionThreshold: String(body.largeTransactionThreshold),
      })
      .where(eq(alertSettingsTable.id, settings.id))
      .returning();

    res.json({
      ...updated,
      lowBalanceThreshold: Number(updated.lowBalanceThreshold),
      largeTransactionThreshold: Number(updated.largeTransactionThreshold),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Settings update failed";
    res.status(400).json({ error: "bad_request", message });
  }
});

export default router;
