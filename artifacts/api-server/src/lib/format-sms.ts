/**
 * SMS-friendly formatters. SMS replies need to be short, scannable, and free of
 * raw bank-statement cruft (ACH descriptors, originator IDs, trace numbers).
 *
 * Goals:
 * - A grandparent on a flip phone should be able to read it.
 * - Stay under ~160 chars per logical line so it fits in a single SMS segment.
 * - Currency always renders as "$1,234.56" (US locale).
 * - Dates render as "May 5" (short month + day, no year).
 */

const ACH_NOISE = [
  /\bORIG\s*CO\s*NAME\s*:?/gi,
  /\bORIG\s*ID\s*:?/gi,
  /\bENTRY\s*DESCR\s*:?/gi,
  /\bSEC\s*:?\s*[A-Z]{2,4}/gi, // SEC:WEB, SEC:PPD, SEC:CCD, etc.
  /\bIND\s*ID\s*:?/gi,
  /\bTRACE\s*#?:?/gi,
  /\bDDA\b/gi,
  /\bACH\s*(DEBIT|CREDIT|TRANSFER|PAYMENT)?/gi,
  /\bPPD\b/gi,
  /\bWEB\s*PMT\b/gi,
  /\bRETRY\s*PYMT\b/gi,
  /\bH\d{6,}\b/g,           // Origin trace IDs like H363899872
  /\b\d{10,}\b/g,           // Raw long numeric IDs
  /\s{2,}/g,
];

/**
 * Turn raw bank-statement gunk into a short, human-readable merchant label.
 *
 * "ORIG CO NAME:PCB PMTS CO ENTRY DESCR:RETRY PYMT SEC:WEB IND ID:0842167603 ORIG ID:H363899872"
 *   -> "PCB Pmts Co"
 *
 * "Zelle payment from ISAAC LLC 0HG08B21YMI3"
 *   -> "Zelle from ISAAC LLC"
 */
export function prettifyMerchant(raw: string | null | undefined, maxLen = 28): string {
  if (!raw) return "Transaction";
  let s = String(raw).trim();

  // Drop ACH descriptors and trace IDs first.
  for (const re of ACH_NOISE) s = s.replace(re, " ");
  s = s.replace(/[:|]+/g, " ").replace(/\s{2,}/g, " ").trim();

  // Trim leading dates/amounts that sometimes get prepended.
  s = s.replace(/^(\d{1,2}\/\d{1,2}(\/\d{2,4})?)\s+/, "");

  // Light title-casing for ALL-CAPS strings (preserves obvious acronyms like LLC, USA, ATM).
  if (s === s.toUpperCase() && s.length > 3) {
    s = s
      .toLowerCase()
      .split(/\s+/)
      .map((w) => (/^(llc|usa|atm|inc|co|corp|us|po|bofa|jp)$/i.test(w) ? w.toUpperCase() : w[0]?.toUpperCase() + w.slice(1)))
      .join(" ");
  }

  if (!s) return "Transaction";
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + "…";
  return s;
}

/** $1,234.56 — never bare numbers in SMS. */
export function formatAmount(n: number): string {
  const abs = Math.abs(n);
  return "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Signed amount: "-$33.00" or "+$1,850.00". */
export function formatSignedAmount(n: number, isCredit: boolean): string {
  return (isCredit ? "+" : "-") + formatAmount(n);
}

/** "May 5" — short month + day, no year. */
export function formatSmsDate(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Keep an SMS body inside one or two segments by hard-cap. */
export function clampSmsBody(text: string, maxLen = 300): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}
