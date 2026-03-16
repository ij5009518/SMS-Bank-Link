import { RestClient } from "@signalwire/compatibility-api";

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID;
const TOKEN = process.env.SIGNALWIRE_TOKEN;
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL;
const _FROM_RAW = process.env.SIGNALWIRE_PHONE_NUMBER ?? "";
const FROM_NUMBER = normalizeFromNumber(_FROM_RAW);

function normalizeFromNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw;
}

if (!PROJECT_ID || !TOKEN || !SPACE_URL) {
  console.warn("[SignalWire] Missing credentials — SMS sending will be disabled");
}

function getClient() {
  if (!PROJECT_ID || !TOKEN || !SPACE_URL) return null;
  return RestClient(PROJECT_ID, TOKEN, { signalwireSpaceUrl: SPACE_URL });
}

export async function sendSms(to: string, body: string): Promise<{ sid: string } | null> {
  const client = getClient();
  if (!client) {
    console.warn("[SignalWire] Cannot send SMS — client not configured");
    return null;
  }
  if (!FROM_NUMBER) {
    console.warn("[SignalWire] SIGNALWIRE_PHONE_NUMBER not set — cannot send SMS");
    return null;
  }

  const normalizedTo = normalizeE164(to);
  if (!normalizedTo) {
    console.error(`[SignalWire] Invalid phone number: ${to}`);
    return null;
  }

  try {
    const msg = await client.messages.create({
      from: FROM_NUMBER,
      to: normalizedTo,
      body,
    });
    console.log(`[SignalWire] Sent SMS to ${normalizedTo} — SID: ${msg.sid}`);
    return { sid: msg.sid };
  } catch (err) {
    console.error("[SignalWire] Failed to send SMS:", err instanceof Error ? err.message : err);
    throw err;
  }
}

export function normalizeE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 7) return `+${digits}`;
  return null;
}

export function isConfigured(): boolean {
  return !!(PROJECT_ID && TOKEN && SPACE_URL && FROM_NUMBER);
}
