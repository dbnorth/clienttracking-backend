import organizations from "../controllers/organization.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], organizations.findAll);
router.get("/:id", [authenticate], organizations.findOne);
router.post("/", [authenticate], organizations.create);
router.put("/:id", [authenticate], organizations.update);
router.delete("/:id", [authenticate], organizations.delete);

export default router;
