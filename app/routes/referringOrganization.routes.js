import referringOrgs from "../controllers/referringOrganization.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], referringOrgs.findAll);
router.get("/:id", [authenticate], referringOrgs.findOne);
router.post("/", [authenticate], referringOrgs.create);
router.put("/:id", [authenticate], referringOrgs.update);
router.delete("/:id", [authenticate], referringOrgs.delete);

export default router;
