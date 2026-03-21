import lookups from "../controllers/lookup.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], lookups.findAll);
router.get("/type/:type", [authenticate], lookups.findByType);
router.post("/", [authenticate], lookups.create);
router.put("/:id", [authenticate], lookups.update);
router.delete("/:id", [authenticate], lookups.delete);

export default router;
