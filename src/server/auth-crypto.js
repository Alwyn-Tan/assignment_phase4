const crypto = require("crypto");

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const TOKEN_BYTES = 32;

function scryptAsync(password, salt, keylen) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N: SCRYPT_COST }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedValue) {
  if (typeof storedValue !== "string") {
    return false;
  }

  const parts = storedValue.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, expectedHex] = parts;
  if (!salt || !/^[a-f0-9]+$/i.test(expectedHex)) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, expectedHex.length / 2);
  const expectedBuffer = Buffer.from(expectedHex, "hex");
  return (
    derivedKey.length === expectedBuffer.length &&
    crypto.timingSafeEqual(derivedKey, expectedBuffer)
  );
}

function createRandomToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

module.exports = {
  hashPassword,
  verifyPassword,
  createRandomToken,
};
