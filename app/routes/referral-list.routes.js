import referrals from "../controllers/referral.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], referrals.findAll);

export default router;
