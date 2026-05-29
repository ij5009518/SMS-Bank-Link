import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { normalizePhone } from "@workspace/db/phone";
import { signUserToken, signAdminToken, verifyToken } from "./tokens.js";
import { encryptSecret, decryptSecret } from "./secret-crypto.js";
import { sanitizeUser } from "./sanitize.js";
import { validateWebhookSignature } from "./signalwire.js";

// These run with env: AUTH_SECRET, TELLER_ENCRYPTION_KEY, SIGNALWIRE_TOKEN
// (see the api-server "test" script).

test("normalizePhone collapses formats to a canonical key", () => {
  assert.equal(normalizePhone("+1 (555) 201-4587"), "5552014587");
  assert.equal(normalizePhone("555-201-4587"), "5552014587");
  assert.equal(normalizePhone("15552014587"), "5552014587");
  assert.equal(normalizePhone("5552014587"), "5552014587");
  assert.equal(normalizePhone("(929) 314-5096"), "9293145096");
  // Non-US (not 11 digits starting with 1) keeps all digits.
  assert.equal(normalizePhone("+44 20 7946 0958"), "442079460958");
  assert.equal(normalizePhone(null), "");
  assert.equal(normalizePhone(undefined), "");
});

test("user tokens round-trip and carry the right claims", () => {
  const token = signUserToken(42);
  const payload = verifyToken(token);
  assert.ok(payload);
  assert.equal(payload?.role, "user");
  assert.equal(payload?.sub, 42);
});

test("admin tokens carry the admin role and no subject", () => {
  const payload = verifyToken(signAdminToken());
  assert.equal(payload?.role, "admin");
  assert.equal(payload?.sub, undefined);
});

test("tampered or malformed tokens are rejected", () => {
  const token = signUserToken(1);
  // Flip the last signature char.
  const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
  assert.equal(verifyToken(tampered), null);
  assert.equal(verifyToken("garbage"), null);
  assert.equal(verifyToken(""), null);
  assert.equal(verifyToken(undefined), null);
});

test("secret encryption round-trips and is non-trivial", () => {
  const plain = "teller-access-token-abc123";
  const enc = encryptSecret(plain);
  assert.notEqual(enc, plain);
  assert.ok(enc.startsWith("enc:v1:"));
  assert.equal(decryptSecret(enc), plain);
});

test("decryptSecret passes through legacy plaintext", () => {
  assert.equal(decryptSecret("legacy-plaintext-token"), "legacy-plaintext-token");
});

test("sanitizeUser strips secrets but keeps profile fields", () => {
  const row = {
    id: 1,
    firstName: "Ada",
    phoneNumber: "5552014587",
    passwordHash: "salt:hash",
    phoneVerificationCode: "123456",
    passwordResetOtp: "999999",
    emailVerificationToken: "tok",
  };
  const safe = sanitizeUser(row) as Record<string, unknown>;
  assert.equal(safe.firstName, "Ada");
  assert.equal(safe.phoneNumber, "5552014587");
  assert.equal("passwordHash" in safe, false);
  assert.equal("phoneVerificationCode" in safe, false);
  assert.equal("passwordResetOtp" in safe, false);
  assert.equal("emailVerificationToken" in safe, false);
});

test("validateWebhookSignature accepts a correct signature and rejects a bad one", () => {
  const token = process.env.SIGNALWIRE_TOKEN!;
  const url = "https://example.com/api/sms/webhook";
  const params = { From: "+15552014587", Body: "BAL" };

  // Replicate the Twilio/SignalWire scheme: sorted key+value appended to URL.
  let data = url;
  for (const key of Object.keys(params).sort()) data += key + String((params as Record<string, string>)[key]);
  const good = createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");

  assert.equal(validateWebhookSignature({ signature: good, url, params }), true);
  assert.equal(validateWebhookSignature({ signature: "wrong", url, params }), false);
  assert.equal(validateWebhookSignature({ signature: undefined, url, params }), false);
});
