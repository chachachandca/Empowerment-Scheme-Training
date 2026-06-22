import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicantsRouter from "./applicants";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(applicantsRouter);

export default router;
