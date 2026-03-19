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

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users/:userId/phones", phonesRouter);
router.use("/users/:userId/categories", categoriesRouter);
router.use("/users/:userId/alerts", alertsRouter);
router.use("/users", usersRouter);
router.use("/accounts", accountsRouter);
router.use("/transactions", transactionsRouter);
router.use("/sms", smsRouter);
router.use("/admin", adminRouter);
router.use("/contact", contactRouter);
router.use("/settings", settingsRouter);
router.use("/teller", tellerRouter);

export default router;
