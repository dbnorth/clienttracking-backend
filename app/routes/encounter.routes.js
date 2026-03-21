import encounters from "../controllers/encounter.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/:clientId/encounters", [authenticate], encounters.create);
router.get("/:clientId/encounters", [authenticate], encounters.findAllForClient);
router.get("/:clientId/encounters/:id", [authenticate], encounters.findOne);
router.put("/:clientId/encounters/:id", [authenticate], encounters.update);
router.delete("/:clientId/encounters/:id", [authenticate], encounters.delete);

export default router;
