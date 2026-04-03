import path from "path";
import fs from "fs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleClientOrNull } from "../authorization/clientAccess.js";

const ClientDocument = db.clientDocument;
const clientDocsUploadDir = "uploads/client-documents";

const DOC_TYPES = ["drivers_license", "birth_certificate", "social_security_card", "misc"];

const toJson = (row) => {
  const d = row.toJSON ? row.toJSON() : row;
  return {
    id: d.id,
    clientId: d.clientId,
    documentType: d.documentType,
    miscDescription: d.miscDescription,
    originalFilename: d.originalFilename,
    mimeType: d.mimeType,
    dateAdded: d.dateAdded,
    fileUrl: d.filePath,
  };
};

const unlinkStored = (filePath) => {
  if (!filePath) return;
  const base = path.basename(filePath);
  const full = path.join(clientDocsUploadDir, base);
  if (fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch (e) {
      logger.error(`Error deleting client document file: ${e.message}`);
    }
  }
};

export const listForClient = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  const client = await getAccessibleClientOrNull(req, clientId);
  if (!client) {
    return res.status(404).send({ message: "Client not found." });
  }
  try {
    const rows = await ClientDocument.findAll({
      where: { clientId },
      order: [["dateAdded", "DESC"], ["id", "DESC"]],
    });
    res.send(rows.map(toJson));
  } catch (err) {
    logger.error(`Error listing client documents: ${err.message}`);
    res.status(500).send({ message: err.message || "Error loading documents." });
  }
};

export const create = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  if (!req.file) {
    return res.status(400).send({ message: "A file is required." });
  }
  const client = await getAccessibleClientOrNull(req, clientId);
  if (!client) {
    unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(404).send({ message: "Client not found." });
  }

  const documentType = req.body.documentType;
  const miscDescription = (req.body.miscDescription || "").trim();
  const dateAdded = (req.body.dateAdded || "").trim() || new Date().toISOString().slice(0, 10);

  if (!DOC_TYPES.includes(documentType)) {
    unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(400).send({ message: "Invalid document type." });
  }
  if (documentType === "misc" && !miscDescription) {
    unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(400).send({ message: "Description is required for Misc." });
  }

  const relPath = path.join("client-documents", req.file.filename).replace(/\\/g, "/");

  try {
    const row = await ClientDocument.create({
      clientId,
      documentType,
      miscDescription: documentType === "misc" ? miscDescription : null,
      filePath: relPath,
      originalFilename: req.file.originalname || null,
      mimeType: req.file.mimetype || null,
      dateAdded,
    });
    res.status(201).send(toJson(row));
  } catch (err) {
    unlinkStored(relPath);
    logger.error(`Error creating client document: ${err.message}`);
    res.status(500).send({ message: err.message || "Error saving document." });
  }
};

export const update = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  const documentId = parseInt(req.params.documentId, 10);
  const client = await getAccessibleClientOrNull(req, clientId);
  if (!client) {
    if (req.file) unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(404).send({ message: "Client not found." });
  }

  const row = await ClientDocument.findOne({ where: { id: documentId, clientId } });
  if (!row) {
    if (req.file) unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(404).send({ message: "Document not found." });
  }

  const documentType = req.body.documentType ?? row.documentType;
  const miscDescription = (req.body.miscDescription ?? row.miscDescription ?? "").trim();
  const dateAdded = (req.body.dateAdded || "").trim() || row.dateAdded;

  if (!DOC_TYPES.includes(documentType)) {
    if (req.file) unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(400).send({ message: "Invalid document type." });
  }
  if (documentType === "misc" && !miscDescription) {
    if (req.file) unlinkStored(path.join("client-documents", req.file.filename));
    return res.status(400).send({ message: "Description is required for Misc." });
  }

  const previousPath = row.filePath;

  const data = {
    documentType,
    miscDescription: documentType === "misc" ? miscDescription : null,
    dateAdded,
  };

  if (req.file) {
    data.filePath = path.join("client-documents", req.file.filename).replace(/\\/g, "/");
    data.originalFilename = req.file.originalname || null;
    data.mimeType = req.file.mimetype || null;
  }

  try {
    await row.update(data);
    if (req.file) {
      unlinkStored(previousPath);
    }
    await row.reload();
    res.send(toJson(row));
  } catch (err) {
    if (req.file) unlinkStored(path.join("client-documents", req.file.filename));
    logger.error(`Error updating client document: ${err.message}`);
    res.status(500).send({ message: err.message || "Error updating document." });
  }
};

export const remove = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  const documentId = parseInt(req.params.documentId, 10);
  const client = await getAccessibleClientOrNull(req, clientId);
  if (!client) {
    return res.status(404).send({ message: "Client not found." });
  }

  const row = await ClientDocument.findOne({ where: { id: documentId, clientId } });
  if (!row) {
    return res.status(404).send({ message: "Document not found." });
  }

  const fp = row.filePath;
  try {
    await row.destroy();
    unlinkStored(fp);
    res.send({ message: "Document deleted." });
  } catch (err) {
    logger.error(`Error deleting client document: ${err.message}`);
    res.status(500).send({ message: err.message || "Error deleting document." });
  }
};
