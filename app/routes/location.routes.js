import locations from "../controllers/location.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], locations.findAll);
router.get("/:id", [authenticate], locations.findOne);
router.post("/", [authenticate], locations.create);
router.put("/:id", [authenticate], locations.update);
router.delete("/:id", [authenticate], locations.delete);

export default router;
