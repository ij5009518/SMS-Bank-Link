import { normalizeE164 } from "./signalwire.js";

export function normalizePhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length >= 10) return digits;
  return null;
}

export function normalizePhoneForStorage(phone: string): { digits: string; canonicalDigits: string | null; e164: string | null } {
  const digits = phone.replace(/\D/g, "");
  return {
    digits,
    canonicalDigits: normalizePhoneDigits(phone),
    e164: normalizeE164(phone),
  };
}
