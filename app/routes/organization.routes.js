import organizations from "../controllers/organization.controller.js";
import authenticate, { requireAdmin, requireSuperAdmin } from "../authorization/authorization.js";
import { uploadOrgLogo } from "../config/multer.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], organizations.findAll);
router.get("/:id", [authenticate], organizations.findOne);
router.post("/", [authenticate, requireSuperAdmin], organizations.create);
router.put("/:id", [authenticate, requireAdmin], organizations.update);
router.put("/:id/logo", [authenticate, requireAdmin], uploadOrgLogo.single("logo"), organizations.uploadLogo);
router.delete("/:id/logo", [authenticate, requireAdmin], organizations.removeLogo);
router.delete("/:id", [authenticate, requireSuperAdmin], organizations.delete);

export default router;
