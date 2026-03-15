import https from "https";
import crypto from "crypto";

const TELLER_API_BASE = "https://api.teller.io";
const APP_ID = process.env.TELLER_APPLICATION_ID;
const CERT_PEM = process.env.TELLER_CERTIFICATE;
const KEY_PEM = process.env.TELLER_PRIVATE_KEY;
const TELLER_ENV = (process.env.TELLER_ENVIRONMENT as "sandbox" | "development" | "production") ?? "sandbox";

if (!APP_ID) {
  console.warn("[Teller] TELLER_APPLICATION_ID is not set — Teller routes will return errors");
}

function normalizePem(raw: string, label: string): string {
  let pem = raw.trim();
  pem = pem.replace(/\\n/g, "\n");
  pem = pem.replace(/\r\n/g, "\n");
  pem = pem.replace(/\r/g, "\n");
  if (pem.startsWith("-----BEGIN")) {
    return pem;
  }
  const stripped = pem.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(stripped)) {
    const chunks = stripped.match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${chunks.join("\n")}\n-----END ${label}-----`;
  }
  return pem;
}

function validateCertAndKey(certStr: string, keyStr: string): { valid: boolean; error?: string } {
  try {
    new crypto.X509Certificate(certStr);
  } catch (e) {
    return { valid: false, error: `Certificate is invalid: ${e instanceof Error ? e.message : e}. The TELLER_CERTIFICATE secret must contain the full PEM certificate from your Teller dashboard (starts with -----BEGIN CERTIFICATE-----)` };
  }
  try {
    crypto.createPrivateKey(keyStr);
  } catch (e) {
    return { valid: false, error: `Private key is invalid: ${e instanceof Error ? e.message : e}. The TELLER_PRIVATE_KEY secret must contain the full PEM private key from your Teller dashboard (starts with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----)` };
  }
  return { valid: true };
}

let cachedAgent: https.Agent | undefined;
let agentChecked = false;

function getTellerAgent(): https.Agent | undefined {
  if (agentChecked) return cachedAgent;
  agentChecked = true;

  if (TELLER_ENV === "sandbox") {
    console.log("[Teller] Sandbox mode — mTLS not required");
    return undefined;
  }

  if (!CERT_PEM || !KEY_PEM) {
    console.warn("[Teller] TELLER_CERTIFICATE or TELLER_PRIVATE_KEY is not set — mTLS disabled");
    return undefined;
  }

  const cert = normalizePem(CERT_PEM, "CERTIFICATE");
  const key = normalizePem(KEY_PEM, "PRIVATE KEY");

  const validation = validateCertAndKey(cert, key);
  if (!validation.valid) {
    console.error(`[Teller] ${validation.error}`);
    return undefined;
  }

  try {
    cachedAgent = new https.Agent({ cert, key });
    console.log("[Teller] mTLS agent created successfully");
    return cachedAgent;
  } catch (err) {
    console.error("[Teller] Failed to create mTLS agent:", err instanceof Error ? err.message : err);
    return undefined;
  }
}

export async function tellerRequest<T>(
  path: string,
  accessToken: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const agent = getTellerAgent();

  if (TELLER_ENV !== "sandbox" && !agent) {
    throw new Error("Teller mTLS is not configured. Check TELLER_CERTIFICATE and TELLER_PRIVATE_KEY secrets — they must contain full PEM files from the Teller dashboard.");
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(accessToken + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };

  const fetchImpl = await import("node-fetch").then((m) => m.default);

  const response = await fetchImpl(`${TELLER_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...(agent ? { agent } : {}),
  } as Parameters<typeof fetchImpl>[1]);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Teller API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export interface TellerAccount {
  id: string;
  institution: { id: string; name: string };
  name: string;
  type: string;
  subtype: string;
  currency: string;
  enrollment_id: string;
  last_four: string;
  links: { self: string; balances: string; transactions: string };
  status: string;
}

export interface TellerBalance {
  account_id: string;
  ledger: string;
  available: string;
  links: { self: string; account: string };
}

export interface TellerTransaction {
  id: string;
  account_id: string;
  date: string;
  description: string;
  details: {
    processing_status: string;
    category: string | null;
    counterparty: { name: string; type: string } | null;
  };
  amount: string;
  running_balance: string | null;
  status: string;
  type: string;
  links: { self: string; account: string };
}

export async function listAccounts(accessToken: string): Promise<TellerAccount[]> {
  return tellerRequest<TellerAccount[]>("/accounts", accessToken);
}

export async function getBalance(accessToken: string, accountId: string): Promise<TellerBalance> {
  return tellerRequest<TellerBalance>(`/accounts/${accountId}/balances`, accessToken);
}

export async function listTransactions(
  accessToken: string,
  accountId: string,
  count = 10
): Promise<TellerTransaction[]> {
  return tellerRequest<TellerTransaction[]>(
    `/accounts/${accountId}/transactions?count=${count}`,
    accessToken
  );
}

export function getTellerAppId() {
  return APP_ID || "";
}
