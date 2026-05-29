/**
 * Canonical phone-number key used for storage and matching.
 *
 * Strips all non-digits and removes a leading US/Canada country code so that
 * "+1 (555) 201-4587", "555-201-4587", and "15552014587" all collapse to the
 * same value ("5552014587"). International numbers (not 11 digits starting
 * with 1) keep their full digit string.
 */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}
