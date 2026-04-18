import stats from "../controllers/stats.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/service-status-timeseries", [authenticate, requireAdmin], stats.serviceStatusTimeseries);
router.get("/clients-added-timeseries", [authenticate, requireAdmin], stats.clientsAddedTimeseries);
router.get("/service-counts-timeseries", [authenticate, requireAdmin], stats.serviceCountsTimeseries);

export default router;
