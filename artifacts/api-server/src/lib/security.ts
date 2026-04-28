import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

const TOKEN_SALT_BYTES = 16;
const GCM_IV_BYTES = 12;
const DEK_BYTES = 32;

type TokenHashRecord = {
  tokenHash: string;
  tokenSalt: string;
};

type EncryptedTokenEnvelope = {
  wrappedDek: string;
  wrappedDekIv: string;
  wrappedDekTag: string;
  ciphertext: string;
  ciphertextIv: string;
  ciphertextTag: string;
};

function hashWithSalt(value: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function hashVerificationToken(token: string): TokenHashRecord {
  const tokenSalt = randomBytes(TOKEN_SALT_BYTES).toString("hex");
  const tokenHash = hashWithSalt(token, tokenSalt);
  return { tokenHash, tokenSalt };
}

export function verifyVerificationToken(input: string, tokenHash: string | null | undefined, tokenSalt: string | null | undefined): boolean {
  if (!tokenHash || !tokenSalt) return false;
  const calculatedHash = hashWithSalt(input, tokenSalt);
  const expected = Buffer.from(tokenHash, "hex");
  const actual = Buffer.from(calculatedHash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function getTellerEncryptionKey(): Buffer {
  const rawKey = process.env.TELLER_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("TELLER_ENCRYPTION_KEY is required to encrypt/decrypt Teller tokens.");
  }

  const key = rawKey.startsWith("base64:")
    ? Buffer.from(rawKey.slice("base64:".length), "base64")
    : rawKey.startsWith("hex:")
      ? Buffer.from(rawKey.slice("hex:".length), "hex")
      : Buffer.from(rawKey, "base64");

  if (key.length !== 32) {
    throw new Error("TELLER_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

function aes256GcmEncrypt(plaintext: Buffer, key: Buffer): { iv: string; ciphertext: string; tag: string } {
  const iv = randomBytes(GCM_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function aes256GcmDecrypt(payload: { iv: string; ciphertext: string; tag: string }, key: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]);
}

export function encryptTellerAccessToken(accessToken: string): EncryptedTokenEnvelope {
  const masterKey = getTellerEncryptionKey();
  const dek = randomBytes(DEK_BYTES);

  const wrapped = aes256GcmEncrypt(dek, masterKey);
  const encrypted = aes256GcmEncrypt(Buffer.from(accessToken, "utf8"), dek);

  return {
    wrappedDek: wrapped.ciphertext,
    wrappedDekIv: wrapped.iv,
    wrappedDekTag: wrapped.tag,
    ciphertext: encrypted.ciphertext,
    ciphertextIv: encrypted.iv,
    ciphertextTag: encrypted.tag,
  };
}

export function decryptTellerAccessToken(envelope: {
  accessTokenCiphertext?: string | null;
  accessTokenCiphertextIv?: string | null;
  accessTokenCiphertextTag?: string | null;
  accessTokenWrappedDek?: string | null;
  accessTokenWrappedDekIv?: string | null;
  accessTokenWrappedDekTag?: string | null;
  accessToken?: string | null;
}): string {
  if (
    envelope.accessTokenCiphertext
    && envelope.accessTokenCiphertextIv
    && envelope.accessTokenCiphertextTag
    && envelope.accessTokenWrappedDek
    && envelope.accessTokenWrappedDekIv
    && envelope.accessTokenWrappedDekTag
  ) {
    const masterKey = getTellerEncryptionKey();
    const dek = aes256GcmDecrypt({
      ciphertext: envelope.accessTokenWrappedDek,
      iv: envelope.accessTokenWrappedDekIv,
      tag: envelope.accessTokenWrappedDekTag,
    }, masterKey);

    const plaintext = aes256GcmDecrypt({
      ciphertext: envelope.accessTokenCiphertext,
      iv: envelope.accessTokenCiphertextIv,
      tag: envelope.accessTokenCiphertextTag,
    }, dek);

    return plaintext.toString("utf8");
  }

  if (envelope.accessToken) {
    return envelope.accessToken;
  }

  throw new Error("Missing Teller access token encryption fields.");
}
