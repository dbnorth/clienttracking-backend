import lookups from "../controllers/lookup.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], lookups.findAll);
router.get("/type/:type", [authenticate], lookups.findByType);
router.post("/seed-starter-set", [authenticate, requireAdmin], lookups.seedStarterSet);
router.post("/", [authenticate, requireAdmin], lookups.create);
router.put("/:id", [authenticate, requireAdmin], lookups.update);
router.delete("/:id", [authenticate, requireAdmin], lookups.delete);

export default router;
