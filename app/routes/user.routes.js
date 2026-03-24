import users from "../controllers/user.controller.js";
import authenticate, { requireAdmin } from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate, requireAdmin], users.findAll);
router.get("/:id", [authenticate, requireAdmin], users.findOne);
router.post("/", [authenticate, requireAdmin], users.create);
router.put("/:id", [authenticate, requireAdmin], users.update);
router.delete("/:id", [authenticate, requireAdmin], users.delete);

export default router;
