import clientservices from "../controllers/clientservice.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/:clientId/clientservices", [authenticate], clientservices.create);
router.post("/:clientId/clientservices/bulk", [authenticate], clientservices.createBulk);
router.get("/:clientId/clientservices", [authenticate], clientservices.findAllForClient);
router.get("/:clientId/clientservices/:id", [authenticate], clientservices.findOne);
router.put("/:clientId/clientservices/:id", [authenticate], clientservices.update);
router.delete("/:clientId/clientservices/:id", [authenticate], clientservices.delete);

export default router;
