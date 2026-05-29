import { randomInt } from "crypto";

/** Cryptographically-secure 6-digit numeric verification code. */
export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}
