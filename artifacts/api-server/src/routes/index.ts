import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import smsRouter from "./sms";
import adminRouter from "./admin";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/accounts", accountsRouter);
router.use("/transactions", transactionsRouter);
router.use("/sms", smsRouter);
router.use("/admin", adminRouter);
router.use("/settings", settingsRouter);

export default router;
