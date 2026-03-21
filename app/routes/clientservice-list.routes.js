import clientservices from "../controllers/clientservice.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], clientservices.findAll);

export default router;
