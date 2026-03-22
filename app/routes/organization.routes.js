import organizations from "../controllers/organization.controller.js";
import authenticate from "../authorization/authorization.js";
import { uploadOrgLogo } from "../config/multer.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], organizations.findAll);
router.get("/:id", [authenticate], organizations.findOne);
router.post("/", [authenticate], organizations.create);
router.put("/:id", [authenticate], organizations.update);
router.put("/:id/logo", [authenticate], uploadOrgLogo.single("logo"), organizations.uploadLogo);
router.delete("/:id/logo", [authenticate], organizations.removeLogo);
router.delete("/:id", [authenticate], organizations.delete);

export default router;
