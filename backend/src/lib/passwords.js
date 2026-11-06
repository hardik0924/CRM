import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

const PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** True for rows written by hashPassword; false for legacy plaintext rows. */
export const isPasswordHash = (value) =>
  typeof value === "string" && value.startsWith(`${PREFIX}$`);

export const hashPassword = async (plain) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
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

  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== PREFIX) return { ok: false, needsRehash: false };

  const salt = Buffer.from(parts[1], "base64url");
  const expected = Buffer.from(parts[2], "base64url");
  // Reject malformed rows instead of deriving with a stored, attacker-length key.
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) {
    return { ok: false, needsRehash: false };
  }

  const derived = await scrypt(plain, salt, KEY_LENGTH, OPTIONS);
  const actual = Buffer.from(derived);
  return {
    ok: crypto.timingSafeEqual(expected, actual),
    needsRehash: false,
  };
};
