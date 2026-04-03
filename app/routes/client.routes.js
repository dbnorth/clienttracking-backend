import clients from "../controllers/client.controller.js";
import { listForClient, create, update, remove } from "../controllers/clientDocument.controller.js";
import authenticate from "../authorization/authorization.js";
import { uploadClientPhoto, uploadClientDocument } from "../config/multer.js";
import { Router } from "express";

const router = Router();

const clientDocumentUpload = (req, res, next) => {
  uploadClientDocument.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).send({ message: err.message || "Invalid file upload." });
    }
    next();
  });
};

router.post("/", [authenticate], clients.create);
router.get("/", [authenticate], clients.findAll);
router.get("/:clientId/documents", [authenticate], listForClient);
router.post("/:clientId/documents", [authenticate], clientDocumentUpload, create);
router.put("/:clientId/documents/:documentId", [authenticate], clientDocumentUpload, update);
router.delete("/:clientId/documents/:documentId", [authenticate], remove);
router.get("/:id", [authenticate], clients.findOne);
router.put("/:id", [authenticate], clients.update);
router.put("/:id/photo", [authenticate], uploadClientPhoto.single("photo"), clients.uploadPhoto);
router.delete("/:id/photo", [authenticate], clients.removePhoto);
router.delete("/:id", [authenticate], clients.delete);

export default router;
