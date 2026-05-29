// Fields on the users table that must never be returned to a client.
const SENSITIVE_USER_FIELDS = [
  "passwordHash",
  "phoneVerificationCode",
  "phoneVerificationExpiry",
  "pendingPhoneCode",
  "pendingPhoneExpiry",
  "deviceVerificationCode",
  "deviceVerificationExpiry",
  "emailVerificationToken",
  "emailVerificationTokenExpiry",
  "passwordResetToken",
  "passwordResetTokenExpiry",
  "passwordResetOtp",
  "passwordResetOtpExpiry",
] as const;

type SensitiveField = (typeof SENSITIVE_USER_FIELDS)[number];

/** Strips password hashes, verification codes, and reset tokens from a user row. */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, SensitiveField> {
  const clone: Record<string, unknown> = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete clone[field];
  }
  return clone as Omit<T, SensitiveField>;
}
