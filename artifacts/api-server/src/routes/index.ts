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
import { requireAuth, requireSelf, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/contact", contactRouter);

// Per-user sub-resources — caller must be the owning user (admins bypass).
router.use("/users/:userId/phones", requireAuth, requireSelf(), phonesRouter);
router.use("/users/:userId/categories", requireAuth, requireSelf(), categoriesRouter);
router.use("/users/:userId/alerts", requireAuth, requireSelf(), alertsRouter);

// Mixed routers — public/owner/admin guards are applied per-route inside.
router.use("/users", usersRouter);
router.use("/accounts", accountsRouter);
router.use("/transactions", transactionsRouter);
router.use("/sms", smsRouter);
router.use("/admin", adminRouter);
router.use("/teller", tellerRouter);

// Global alert settings are admin-only.
router.use("/settings", requireAdmin, settingsRouter);

export default router;
