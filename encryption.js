const crypto = require("crypto");

/**
 * AES-256-GCM authenticated encryption utility.
 *
 * Used for sensitive-but-not-hashed fields (e.g. insurance numbers,
 * FASTag identifiers) where we need to read the plaintext back later.
 * Passwords must NEVER use this — use bcrypt (see middleware/auth + models/User).
 *
 * ENCRYPTION_KEY must be a 64-character hex string (32 bytes) set in .env.
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set in .env as a 64-character hex string (32 bytes)."
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a plaintext string.
 * @param {string} plainText
 * @returns {string} Combined "iv:authTag:cipherText" hex string, safe to store in DB.
 */
function encrypt(plainText) {
  if (plainText === null || plainText === undefined) return null;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypts a string produced by encrypt().
 * @param {string} payload
 * @returns {string|null}
 */
function decrypt(payload) {
  if (!payload) return null;

  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format.");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * One-way hash for values we need to search/index but never decrypt
 * (e.g. deterministic lookup of a vehicle number without storing plaintext elsewhere).
 * Not a substitute for bcrypt on passwords.
 */
function sha256Hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = { encrypt, decrypt, sha256Hash };
