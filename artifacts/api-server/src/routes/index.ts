import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nutAiRouter from "./nutai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nutAiRouter);

export default router;
