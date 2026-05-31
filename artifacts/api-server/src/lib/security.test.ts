import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { normalizePhone } from "@workspace/db/phone";
import { signUserToken, signAdminToken, verifyToken } from "./tokens.js";
import { encryptSecret, decryptSecret } from "./secret-crypto.js";
import { sanitizeUser } from "./sanitize.js";
import { validateWebhookSignature } from "./signalwire.js";
import { prettifyMerchant, formatAmount, formatSignedAmount, formatSmsDate } from "./format-sms.js";

test("normalizePhone canonicalizes", () => {
  assert.equal(normalizePhone("+1 (555) 201-4587"), "5552014587");
  assert.equal(normalizePhone("15552014587"), "5552014587");
});

test("user tokens round-trip", () => {
  const c = verifyToken(signUserToken(42));
  assert.ok(c);
  assert.equal(c.sub, 42);
  assert.equal(c.role, "user");
});

test("admin tokens carry admin role", () => {
  const c = verifyToken(signAdminToken());
  assert.ok(c);
  assert.equal(c.role, "admin");
});

test("tampered tokens rejected", () => {
  assert.equal(verifyToken(""), null);
  assert.equal(verifyToken("not-a-token"), null);
  const v = signUserToken(7);
  const [b, s] = v.split(".");
  assert.equal(verifyToken(b + "." + s.slice(0,-1) + (s.endsWith("A")?"B":"A")), null);
});

test("secret encryption round-trips", () => {
  const p = "teller-token-abc";
  const e = encryptSecret(p);
  assert.notEqual(e, p);
  assert.equal(decryptSecret(e), p);
  assert.notEqual(e, encryptSecret(p));
});

test("decryptSecret passes through plaintext", () => {
  assert.equal(decryptSecret("plain"), "plain");
});

test("sanitizeUser strips secrets", () => {
  const u = { id:1, firstName:"Ada", phoneNumber:"5552014587", passwordHash:"x", phoneVerificationCode:"1", passwordResetOtp:"2", emailVerificationToken:"t" };
  const s = sanitizeUser(u) as Record<string, unknown>;
  assert.equal(s.firstName, "Ada");
  assert.ok(!("passwordHash" in s));
  assert.ok(!("phoneVerificationCode" in s));
});

test("webhook signature validates", () => {
  const token = process.env.SIGNALWIRE_TOKEN!;
  const url = "https://example.com/api/sms/webhook";
  const params = { From: "+15552014587", Body: "BAL" };
  let data = url;
  for (const k of Object.keys(params).sort()) data += k + (params as any)[k];
  const good = createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");
  assert.equal(validateWebhookSignature({ signature: good, url, params }), true);
  assert.equal(validateWebhookSignature({ signature: "wrong", url, params }), false);
});

test("prettifyMerchant strips ACH cruft", () => {
  const out = prettifyMerchant("ORIG CO NAME:PCB PMTS CO ENTRY DESCR:RETRY PYMT SEC:WEB IND ID:0842167603 ORIG ID:H363899872");
  assert.ok(!out.includes("ORIG"));
  assert.ok(!out.includes("ENTRY"));
  assert.ok(!out.includes("H363899872"));
  assert.ok(out.length <= 28);
});

test("prettifyMerchant title-cases ALL-CAPS", () => {
  assert.equal(prettifyMerchant("U S BANK"), "U S Bank");
  assert.equal(prettifyMerchant("DISCOVER"), "Discover");
  assert.equal(prettifyMerchant("ISAAC LLC"), "Isaac LLC");
});

test("prettifyMerchant handles missing", () => {
  assert.equal(prettifyMerchant(null), "Transaction");
  assert.equal(prettifyMerchant(""), "Transaction");
});

test("formatAmount + formatSignedAmount", () => {
  assert.equal(formatAmount(1234.5), "$1,234.50");
  assert.equal(formatAmount(0), "$0.00");
  assert.equal(formatSignedAmount(33, false), "-$33.00");
  assert.equal(formatSignedAmount(1850, true), "+$1,850.00");
});

test("formatSmsDate short month + day", () => {
  assert.equal(formatSmsDate(new Date("2026-05-29T12:00:00Z")), "May 29");
});
