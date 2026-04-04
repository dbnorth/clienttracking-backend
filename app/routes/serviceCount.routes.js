import serviceCounts from "../controllers/serviceCount.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], serviceCounts.findAll);
router.get("/:id", [authenticate], serviceCounts.findOne);
router.post("/", [authenticate], serviceCounts.create);
router.put("/:id", [authenticate], serviceCounts.update);
router.delete("/:id", [authenticate], serviceCounts.delete);

export default router;
