import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nutAiRouter from "./nutai";
import studyNutRouter from "./studynut";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nutAiRouter);
router.use(studyNutRouter);

export default router;
