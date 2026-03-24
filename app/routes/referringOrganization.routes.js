import referringOrgs from "../controllers/referringOrganization.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], referringOrgs.findAll);
router.get("/:id", [authenticate], referringOrgs.findOne);
router.post("/", [authenticate, requireAdmin], referringOrgs.create);
router.put("/:id", [authenticate, requireAdmin], referringOrgs.update);
router.delete("/:id", [authenticate, requireAdmin], referringOrgs.delete);

export default router;
