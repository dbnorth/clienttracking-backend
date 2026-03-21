import users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], users.findAll);
router.get("/:id", [authenticate], users.findOne);
router.post("/", [authenticate], users.create);
router.put("/:id", [authenticate], users.update);

export default router;
