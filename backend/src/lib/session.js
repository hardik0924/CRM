import crypto from "node:crypto";

const DEFAULT_TTL_MINUTES = 12 * 60;
let ephemeralSecret = null;

/**
 * Sessions are HMAC-signed bearer tokens. A missing AUTH_TOKEN_SECRET gets a
 * random per-process secret instead of a known default: the app still runs,
 * but every restart signs existing sessions out.
 */
const secret = () => {
  const configured = process.env.AUTH_TOKEN_SECRET;
  if (configured) return configured;
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "AUTH_TOKEN_SECRET is not set; using a random secret for this process. Sessions end when the server restarts."
    );
  }
  return ephemeralSecret;
};

export const tokenTtlSeconds = () => {
  const minutes = Number(process.env.AUTH_TOKEN_TTL_MINUTES || DEFAULT_TTL_MINUTES);
  return Math.max(60, Number.isFinite(minutes) ? minutes * 60 : DEFAULT_TTL_MINUTES * 60);
};

const signature = (body) =>
  crypto.createHmac("sha256", secret()).update(body).digest("base64url");

// Opaque binding to the stored password, keyed so the token does not leak a
// plain hash of the credential.
const fingerprint = (stored) =>
  crypto.createHmac("sha256", secret()).update(String(stored || "")).digest("base64url").slice(0, 22);

const payloadPart = (user, now) => ({
  sub: user.user_id,
  // Changing the stored password invalidates every token issued before it.
  fp: fingerprint(user.user_password),
  iat: Math.floor(now / 1000),
  exp: Math.floor(now / 1000) + tokenTtlSeconds(),
});

export const signSessionToken = (user, now = Date.now()) => {
  const body = Buffer.from(JSON.stringify(payloadPart(user, now))).toString("base64url");
  return `${body}.${signature(body)}`;
};

export const verifySessionToken = (token, now = Date.now()) => {
  if (typeof token !== "string" || !token.includes(".")) return null;

  const [body, provided] = token.split(".");
  if (!body || !provided) return null;

  const expected = signature(body);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.sub !== "string" || !payload.sub) return null;
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(now / 1000)) return null;
  return payload;
};

export const sessionMatchesUser = (payload, user) =>
  Boolean(
    payload &&
      user &&
      payload.sub === user.user_id &&
      payload.fp === fingerprint(user.user_password)
  );

/** Bearer token; the legacy X-User-Id header is deliberately ignored. */
export const readSessionToken = (req) => {
  const header = req.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim() || null;
  }
  return null;
};
