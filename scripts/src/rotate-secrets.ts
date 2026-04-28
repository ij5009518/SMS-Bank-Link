import { db } from "@workspace/db";
import { usersTable, trustedDevicesTable, tellerEnrollmentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, createCipheriv } from "crypto";

function hashToken(token: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${token}`).digest("hex");
  return { hash, salt };
}

function getKey(): Buffer | null {
  const raw = process.env.TELLER_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = raw.startsWith("base64:")
    ? Buffer.from(raw.slice(7), "base64")
    : raw.startsWith("hex:")
      ? Buffer.from(raw.slice(4), "hex")
      : Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

function encrypt(accessToken: string, key: Buffer) {
  const dek = randomBytes(32);

  const wrapIv = randomBytes(12);
  const wrapCipher = createCipheriv("aes-256-gcm", key, wrapIv);
  const wrappedDek = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()]);
  const wrappedDekTag = wrapCipher.getAuthTag();

  const tokenIv = randomBytes(12);
  const tokenCipher = createCipheriv("aes-256-gcm", dek, tokenIv);
  const tokenCiphertext = Buffer.concat([tokenCipher.update(Buffer.from(accessToken, "utf8")), tokenCipher.final()]);
  const tokenTag = tokenCipher.getAuthTag();

  return {
    accessTokenCiphertext: tokenCiphertext.toString("base64"),
    accessTokenCiphertextIv: tokenIv.toString("base64"),
    accessTokenCiphertextTag: tokenTag.toString("base64"),
    accessTokenWrappedDek: wrappedDek.toString("base64"),
    accessTokenWrappedDekIv: wrapIv.toString("base64"),
    accessTokenWrappedDekTag: wrappedDekTag.toString("base64"),
  };
}

async function main() {
  const users = await db.select().from(usersTable);
  for (const user of users) {
    const updates: Record<string, string | null> = {};

    if (user.phoneVerificationCode && !user.phoneVerificationCodeHash) {
      const h = hashToken(user.phoneVerificationCode);
      updates.phoneVerificationCode = null;
      updates.phoneVerificationCodeHash = h.hash;
      updates.phoneVerificationCodeSalt = h.salt;
    }
    if (user.pendingPhoneCode && !user.pendingPhoneCodeHash) {
      const h = hashToken(user.pendingPhoneCode);
      updates.pendingPhoneCode = null;
      updates.pendingPhoneCodeHash = h.hash;
      updates.pendingPhoneCodeSalt = h.salt;
    }
    if (user.deviceVerificationCode && !user.deviceVerificationCodeHash) {
      const h = hashToken(user.deviceVerificationCode);
      updates.deviceVerificationCode = null;
      updates.deviceVerificationCodeHash = h.hash;
      updates.deviceVerificationCodeSalt = h.salt;
    }
    if (user.emailVerificationToken && !user.emailVerificationTokenHash) {
      const h = hashToken(user.emailVerificationToken);
      updates.emailVerificationToken = null;
      updates.emailVerificationTokenHash = h.hash;
      updates.emailVerificationTokenSalt = h.salt;
    }
    if (user.passwordResetToken && !user.passwordResetTokenHash) {
      const h = hashToken(user.passwordResetToken);
      updates.passwordResetToken = null;
      updates.passwordResetTokenHash = h.hash;
      updates.passwordResetTokenSalt = h.salt;
    }
    if (user.passwordResetOtp && !user.passwordResetOtpHash) {
      const h = hashToken(user.passwordResetOtp);
      updates.passwordResetOtp = null;
      updates.passwordResetOtpHash = h.hash;
      updates.passwordResetOtpSalt = h.salt;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    }
  }

  const devices = await db.select().from(trustedDevicesTable);
  for (const device of devices) {
    if (device.token && !device.tokenHash) {
      const h = hashToken(device.token);
      await db.update(trustedDevicesTable)
        .set({ tokenHash: h.hash, tokenSalt: h.salt })
        .where(eq(trustedDevicesTable.id, device.id));
    }
  }

  const key = getKey();
  const enrollments = await db.select().from(tellerEnrollmentsTable);
  for (const enrollment of enrollments) {
    if (enrollment.accessTokenCiphertext) continue;

    if (!key || !enrollment.accessToken || enrollment.accessToken === "__encrypted__") {
      await db.delete(tellerEnrollmentsTable).where(eq(tellerEnrollmentsTable.id, enrollment.id));
      continue;
    }

    const payload = encrypt(enrollment.accessToken, key);
    await db.update(tellerEnrollmentsTable).set({
      ...payload,
      accessToken: "__encrypted__",
    }).where(eq(tellerEnrollmentsTable.id, enrollment.id));
  }

  console.log("Secret rotation completed.");
}

main().catch((err) => {
  console.error("Rotation failed:", err);
  process.exit(1);
});
