import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, isPasswordHash, verifyPassword } from "../src/lib/passwords.js";
import {
  readSessionToken,
  sessionMatchesUser,
  signSessionToken,
  verifySessionToken,
} from "../src/lib/session.js";
import { authMiddleware } from "../src/middleware/auth.middleware.js";

// Read at call time by lib/session.js, so setting it here is enough.
process.env.AUTH_TOKEN_SECRET = "test-secret-that-is-long-enough-for-hmac";

const storedHash = "$scrypt$placeholder";
const user = { user_id: "user-1", user_password: storedHash };

const makeRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

const runMiddleware = async (headers) => {
  const res = makeRes();
  let nextCalled = false;
  await authMiddleware({ headers }, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

test("a signed session token round-trips and identifies the user", () => {
  const token = signSessionToken(user);
  assert.equal(verifySessionToken(token).sub, "user-1");
});

test("a tampered or foreign token is rejected", () => {
  const token = signSessionToken(user);
  assert.equal(verifySessionToken(`${token}tampered`), null);

  process.env.AUTH_TOKEN_SECRET = "another-secret-that-is-long-enough-for-hmac";
  assert.equal(verifySessionToken(token), null);
  process.env.AUTH_TOKEN_SECRET = "test-secret-that-is-long-enough-for-hmac";
});

test("an expired token is rejected", () => {
  const issuedOverTtlAgo = Date.now() - 13 * 60 * 60 * 1000;
  const expired = signSessionToken(user, issuedOverTtlAgo);
  assert.equal(verifySessionToken(expired), null);
});

test("X-User-Id alone no longer authenticates (spoofing regression)", async () => {
  const { res, nextCalled } = await runMiddleware({ "x-user-id": user.user_id });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("a malformed bearer token is rejected", async () => {
  const { res, nextCalled } = await runMiddleware({ authorization: "Bearer not-a-session" });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("only the Authorization header is read, never X-User-Id", () => {
  const token = signSessionToken(user);
  assert.equal(readSessionToken({ headers: { authorization: `Bearer ${token}` } }), token);
  assert.equal(readSessionToken({ headers: { "x-user-id": user.user_id } }), null);
});

test("passwords are stored as salted scrypt hashes and verify correctly", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.ok(isPasswordHash(hash));
  assert.notEqual(hash, "correct horse battery staple");
  assert.equal((await verifyPassword(hash, "correct horse battery staple")).ok, true);
  assert.equal((await verifyPassword(hash, "wrong password")).ok, false);
  assert.equal((await verifyPassword(hash, "correct horse battery staple")).needsRehash, false);
});

test("a legacy plaintext password verifies once and asks to be rehashed", async () => {
  const result = await verifyPassword("0000", "0000");
  assert.equal(result.ok, true);
  assert.equal(result.needsRehash, true);
  assert.equal((await verifyPassword("0000", "0001")).ok, false);
});

test("changing the stored password invalidates existing tokens", () => {
  const token = signSessionToken(user);
  const payload = verifySessionToken(token);
  assert.equal(sessionMatchesUser(payload, user), true);
  assert.equal(sessionMatchesUser(payload, { ...user, user_password: "$scrypt$changed" }), false);
});

test("CORS reflects only configured origins", async () => {
  process.env.CORS_ORIGINS = "https://crm.example.com";
  const { app } = await import("../src/server.js");
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const allowed = await fetch(base, { headers: { Origin: "https://crm.example.com" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://crm.example.com");

    const blocked = await fetch(base, { headers: { Origin: "https://evil.example" } });
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  }
});
