import encounters from "../controllers/encounter.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], encounters.findAll);

export default router;
