import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mpfRouter from "./mpf";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mpfRouter);

export default router;
