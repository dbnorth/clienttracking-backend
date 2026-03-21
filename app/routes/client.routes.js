import clients from "../controllers/client.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], clients.create);
router.get("/", [authenticate], clients.findAll);
router.get("/:id", [authenticate], clients.findOne);
router.put("/:id", [authenticate], clients.update);
router.delete("/:id", [authenticate], clients.delete);

export default router;
