import multer from "multer";
import path from "path";
import fs from "fs";

const orgLogosDir = "uploads/organization-logos";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(orgLogosDir, { recursive: true });
    cb(null, orgLogosDir);
  },
  filename: (req, file, cb) => {
    const ext =
      file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/jpeg"
          ? ".jpg"
          : file.mimetype === "image/gif"
            ? ".gif"
            : ".png";
    cb(null, `${req.params.id}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPEG, and GIF images are allowed."), false);
  }
};

export const uploadOrgLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const clientPhotosDir = "uploads/client-photos";
const clientPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(clientPhotosDir, { recursive: true });
    cb(null, clientPhotosDir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" ? ".jpg" : ".jpg";
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

export const uploadClientPhoto = multer({
  storage: clientPhotoStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const clientDocsDir = "uploads/client-documents";
const clientDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(clientDocsDir, { recursive: true });
    cb(null, clientDocsDir);
  },
  filename: (req, file, cb) => {
    const base = `${req.params.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const lower = (file.originalname || "").toLowerCase();
    let ext = ".bin";
    if (lower.endsWith(".png")) ext = ".png";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ext = ".jpg";
    else if (lower.endsWith(".heic")) ext = ".heic";
    else if (lower.endsWith(".heif")) ext = ".heif";
    else if (lower.endsWith(".pdf")) ext = ".pdf";
    cb(null, `${base}${ext}`);
  },
});

const clientDocMime = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const clientDocFilter = (_req, file, cb) => {
  const name = (file.originalname || "").toLowerCase();
  const okByExt = /\.(png|jpe?g|heic|heif|pdf)$/i.test(name);
  if (clientDocMime.has(file.mimetype) || (file.mimetype === "application/octet-stream" && okByExt)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, HEIC, HEIF, or PDF files are allowed."), false);
  }
};

export const uploadClientDocument = multer({
  storage: clientDocStorage,
  fileFilter: clientDocFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});
