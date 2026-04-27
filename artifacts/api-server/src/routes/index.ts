import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import smsRouter from "./sms";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import tellerRouter from "./teller";
import authRouter from "./auth";
import phonesRouter from "./phones";
import categoriesRouter from "./categories";
import alertsRouter from "./alerts";
import contactRouter from "./contact";
import { requireAdmin, requireAuth, requireSelfOrAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

// Explicit public routes
router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/sms", smsRouter);
router.use("/contact", contactRouter);

// User-scoped routes: owner or admin only
router.use("/users/:userId/phones", requireAuth, requireSelfOrAdmin("userId"), phonesRouter);
router.use("/users/:userId/categories", requireAuth, requireSelfOrAdmin("userId"), categoriesRouter);
router.use("/users/:userId/alerts", requireAuth, requireSelfOrAdmin("userId"), alertsRouter);
router.use("/accounts/:userId", requireAuth, requireSelfOrAdmin("userId"));
router.use("/transactions/:userId", requireAuth, requireSelfOrAdmin("userId"));

// Sensitive routers
router.use("/users", requireAuth, usersRouter);
router.use("/accounts", requireAuth, accountsRouter);
router.use("/transactions", requireAuth, transactionsRouter);
router.use("/settings", requireAdmin, settingsRouter);
router.use("/teller", requireAuth, tellerRouter);
router.use("/admin", adminRouter);

export default router;
