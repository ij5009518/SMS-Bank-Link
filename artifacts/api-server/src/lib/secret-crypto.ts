import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// AES-256-GCM encryption for secrets at rest (e.g. Teller bank access tokens).
// Backward-compatible: values that aren't in the `enc:v1:` format are returned
// unchanged, so pre-existing plaintext rows keep working until rewritten.

const RAW_KEY = process.env.TELLER_ENCRYPTION_KEY || process.env.AUTH_SECRET || "";
const KEY = RAW_KEY ? createHash("sha256").update(RAW_KEY).digest() : null;
const PREFIX = "enc:v1:";

if (!KEY) {
  console.warn(
    "[Crypto] No TELLER_ENCRYPTION_KEY/AUTH_SECRET set — bank access tokens will be stored in plaintext. " +
      "Set one of these to encrypt secrets at rest.",
  );
}

export function encryptSecret(plain: string): string {
  if (!KEY) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored; // legacy / plaintext
  if (!KEY) {
    console.error("[Crypto] Encrypted secret encountered but no decryption key is configured.");
    return stored;
  }
  try {
    const [ivB64, tagB64, ctB64] = stored.slice(PREFIX.length).split(":");
    const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB64!, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ctB64!, "base64")), decipher.final()]).toString("utf8");
  } catch (e) {
    console.error("[Crypto] Failed to decrypt secret:", e instanceof Error ? e.message : e);
    return stored;
  }
}
