import servicerecords from "../controllers/servicerecord.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/:clientId/servicerecords", [authenticate], servicerecords.create);
router.get("/:clientId/servicerecords", [authenticate], servicerecords.findAllForClient);
router.put("/:clientId/servicerecords/:id", [authenticate], servicerecords.update);
router.delete("/:clientId/servicerecords/:id", [authenticate], servicerecords.delete);

export default router;
