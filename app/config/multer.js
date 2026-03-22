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
