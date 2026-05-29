import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Liveness — the process is up.
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness — the process can reach its dependencies (the database).
router.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready" });
  } catch (e) {
    res.status(503).json({ status: "unavailable", error: e instanceof Error ? e.message : "db_unreachable" });
  }
});

export default router;
