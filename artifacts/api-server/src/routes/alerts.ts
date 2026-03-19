import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router({ mergeParams: true });

// GET /api/users/:userId/alerts
router.get("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request" });
  const alerts = await db.select().from(alertsTable).where(eq(alertsTable.userId, userId));
  return res.json(alerts);
});

// POST /api/users/:userId/alerts
router.post("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request" });

  const { alertType, threshold, channel, enabled } = req.body as {
    alertType?: string; threshold?: number; channel?: string; enabled?: boolean;
  };
  if (!alertType) return res.status(400).json({ error: "bad_request", message: "Alert type is required." });

  const [alert] = await db.insert(alertsTable).values({
    userId,
    alertType,
    threshold: threshold !== undefined ? String(threshold) : null,
    channel: channel ?? "sms",
    enabled: enabled !== false,
  }).returning();

  return res.status(201).json(alert);
});

// PATCH /api/users/:userId/alerts/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { threshold, channel, enabled, alertType } = req.body as {
    threshold?: number; channel?: string; enabled?: boolean; alertType?: string;
  };

  const updates: Record<string, unknown> = {};
  if (threshold !== undefined) updates.threshold = String(threshold);
  if (channel !== undefined) updates.channel = channel;
  if (enabled !== undefined) updates.enabled = enabled;
  if (alertType !== undefined) updates.alertType = alertType;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "bad_request" });

  const [updated] = await db.update(alertsTable).set(updates).where(eq(alertsTable.id, id)).returning();
  if (!updated || updated.userId !== userId) return res.status(404).json({ error: "not_found" });
  return res.json(updated);
});

// DELETE /api/users/:userId/alerts/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const [deleted] = await db.delete(alertsTable).where(eq(alertsTable.id, id)).returning();
  if (!deleted || deleted.userId !== userId) return res.status(404).json({ error: "not_found" });
  return res.json({ success: true });
});

export default router;
