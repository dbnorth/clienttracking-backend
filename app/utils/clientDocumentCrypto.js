import crypto from "crypto";
import fs from "fs";
import logger from "../config/logger.js";

const MAGIC = Buffer.from("CTENC1", "utf8");
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

let cachedKey = null;

/**
 * Derives a 32-byte AES key from CLIENT_DOCUMENTS_ENCRYPTION_KEY.
 * Use a long random secret or a 64-character hex string (256 bits).
 * In production the env var is required.
 */
export function getDocumentEncryptionKey() {
  if (cachedKey) return cachedKey;
  const raw = process.env.CLIENT_DOCUMENTS_ENCRYPTION_KEY;
  const trimmed = raw != null ? String(raw).trim() : "";
  if (trimmed.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CLIENT_DOCUMENTS_ENCRYPTION_KEY must be set in production (min 16 characters; 64-char hex recommended)."
      );
    }
    logger.warn(
      "CLIENT_DOCUMENTS_ENCRYPTION_KEY not set; using a development-only key. Set a strong secret before production."
    );
    cachedKey = crypto.scryptSync("clienttracking-dev-document-key", "ct-docs-salt-v1", 32);
    return cachedKey;
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    cachedKey = Buffer.from(trimmed, "hex");
    return cachedKey;
  }
  cachedKey = crypto.createHash("sha256").update(trimmed).digest();
  return cachedKey;
}

export function isEncryptedFilePayload(buf) {
  return (
    Buffer.isBuffer(buf) &&
    buf.length >= MAGIC.length + IV_LENGTH + TAG_LENGTH &&
    buf.subarray(0, MAGIC.length).equals(MAGIC)
  );
}

export function encryptBuffer(plaintext) {
  const key = getDocumentEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, ciphertext]);
}

/**
 * Returns plaintext buffer. If payload is not wrapped with MAGIC, returns a copy of the original (legacy uploads).
 */
export function decryptBufferIfNeeded(buf) {
  if (!isEncryptedFilePayload(buf)) {
    return Buffer.from(buf);
  }
  const key = getDocumentEncryptionKey();
  let offset = MAGIC.length;
  const iv = buf.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const tag = buf.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;
  const ciphertext = buf.subarray(offset);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptFileInPlace(absPath) {
  const plain = fs.readFileSync(absPath);
  const enc = encryptBuffer(plain);
  fs.writeFileSync(absPath, enc);
}
