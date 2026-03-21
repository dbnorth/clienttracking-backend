import auth from "../controllers/auth.controller.js";
import db from "../models/index.js";
import { Router } from "express";

const router = Router();
const Organization = db.organization;

router.get("/organizations-for-registration", (req, res) => {
  Organization.findAll({ order: [["name", "ASC"]], attributes: ["id", "name"] })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
});

router.post("/login", auth.login);
router.post("/register", auth.register);
router.post("/reset-password", auth.resetPassword);
router.post("/logout", auth.logout);

export default router;
