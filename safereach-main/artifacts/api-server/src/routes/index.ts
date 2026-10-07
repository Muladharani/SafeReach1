import { Router, type IRouter } from "express";
import healthRouter from "./health";
import safeReachRouter from "./safereach";

const router: IRouter = Router();

router.use(healthRouter);
router.use(safeReachRouter);

export default router;
