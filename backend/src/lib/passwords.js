import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

const PREFIX = "scrypt";
const KEY_LENGTH = 64;
const OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** True for rows written by hashPassword; false for legacy plaintext rows. */
export const isPasswordHash = (value) =>
  typeof value === "string" && value.startsWith(`${PREFIX}$`);

export const hashPassword = async (plain) => {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(plain, salt, KEY_LENGTH, OPTIONS);
  return `${PREFIX}$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
};

const digest = (value) => crypto.createHash("sha256").update(value).digest();

/**
 * Compares a stored value with a supplied password. Legacy plaintext rows still
 * verify once and report needsRehash so the caller can upgrade them in place.
 */
export const verifyPassword = async (stored, plain) => {
  if (typeof stored !== "string" || typeof plain !== "string") {
    return { ok: false, needsRehash: false };
  }

  if (!isPasswordHash(stored)) {
    const ok = crypto.timingSafeEqual(digest(stored), digest(plain));
    return { ok, needsRehash: ok };
  }

  const [, saltPart, hashPart] = stored.split("$");
  if (!saltPart || !hashPart) return { ok: false, needsRehash: false };

  const expected = Buffer.from(hashPart, "base64url");
  const derived = await scrypt(plain, Buffer.from(saltPart, "base64url"), expected.length, OPTIONS);
  const actual = Buffer.from(derived);
  return {
    ok: expected.length === actual.length && crypto.timingSafeEqual(expected, actual),
    needsRehash: false,
  };
};
