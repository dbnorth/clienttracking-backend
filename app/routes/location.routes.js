import locations from "../controllers/location.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], locations.findAll);
router.get("/:id", [authenticate], locations.findOne);
router.post("/", [authenticate, requireAdmin], locations.create);
router.put("/:id", [authenticate, requireAdmin], locations.update);
router.delete("/:id", [authenticate, requireAdmin], locations.delete);

export default router;
