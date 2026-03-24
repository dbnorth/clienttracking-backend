import auth from "../controllers/auth.controller.js";
import { Router } from "express";

const router = Router();

router.post("/login", auth.login);
router.post("/reset-password", auth.resetPassword);
router.post("/logout", auth.logout);

export default router;
