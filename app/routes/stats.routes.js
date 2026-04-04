import stats from "../controllers/stats.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/service-status-timeseries", [authenticate, requireAdmin], stats.serviceStatusTimeseries);

export default router;
