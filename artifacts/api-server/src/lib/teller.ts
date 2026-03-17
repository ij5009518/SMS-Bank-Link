import https from "https";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const TELLER_API_BASE = "https://api.teller.io";
const APP_ID = process.env.TELLER_APPLICATION_ID;
const TELLER_ENV = (process.env.TELLER_ENVIRONMENT as "sandbox" | "development" | "production") ?? "sandbox";

if (!APP_ID) {
  console.warn("[Teller] TELLER_APPLICATION_ID is not set — Teller routes will return errors");
}

// In development (tsx), resolve certs relative to the source file.
// In production (CJS esbuild bundle), import.meta.url is unavailable so we skip
// file-based certs entirely and rely on TELLER_CERTIFICATE / TELLER_PRIVATE_KEY env vars.
const CERT_FILE: string | null = process.env.NODE_ENV === "development"
  ? path.resolve(process.cwd(), "artifacts/api-server/certs/teller_certificate.pem")
  : null;
const KEY_FILE: string | null = process.env.NODE_ENV === "development"
  ? path.resolve(process.cwd(), "artifacts/api-server/certs/teller_private_key.pem")
  : null;

function loadPem(filePath: string | null, envVar: string | undefined, label: string): string | null {
  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (content.startsWith("-----BEGIN")) {
      console.log(`[Teller] Loaded ${label} from file: ${path.basename(filePath)}`);
      return content;
    }
    console.warn(`[Teller] File ${path.basename(filePath)} exists but does not look like a valid PEM — ignoring`);
  }

  if (!envVar) return null;

  let pem = envVar.trim();
  pem = pem.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 1. Raw PEM
  if (pem.startsWith("-----BEGIN")) {
    console.log(`[Teller] Loaded ${label} from environment variable (raw PEM)`);
    return pem;
  }

  // 2. Base64-encoded PEM — the whole PEM file was base64-encoded before storing
  try {
    const decoded = Buffer.from(pem, "base64").toString("utf8").trim();
    if (decoded.startsWith("-----BEGIN")) {
      console.log(`[Teller] Loaded ${label} from environment variable (base64-decoded PEM)`);
      return decoded;
    }
  } catch { /* not base64 */ }

  // 3. Raw base64 DER (no headers) — wrap in PEM headers and try
  const isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(pem);
  if (isBase64) {
    const headerType = label.toLowerCase().includes("key") ? "PRIVATE KEY" : "CERTIFICATE";
    const body = pem.replace(/\s/g, "").match(/.{1,64}/g)?.join("\n") ?? pem;
    const wrapped = `-----BEGIN ${headerType}-----\n${body}\n-----END ${headerType}-----`;
    console.log(`[Teller] Loaded ${label} from environment variable (wrapped base64 DER)`);
    return wrapped;
  }

  console.warn(`[Teller] ${label} env var does not contain a valid PEM (no -----BEGIN header) — ignoring`);
  return null;
}

function validateCertAndKey(cert: string, key: string): { valid: boolean; error?: string } {
  try {
    new crypto.X509Certificate(cert);
  } catch (e) {
    return { valid: false, error: `Certificate invalid: ${e instanceof Error ? e.message : e}` };
  }
  try {
    crypto.createPrivateKey(key);
  } catch (e) {
    return { valid: false, error: `Private key invalid: ${e instanceof Error ? e.message : e}` };
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

  const cert = loadPem(CERT_FILE, process.env.TELLER_CERTIFICATE, "certificate");
  const key = loadPem(KEY_FILE, process.env.TELLER_PRIVATE_KEY, "private key");

  if (!cert || !key) {
    console.error("[Teller] mTLS certificate or private key missing — Teller API calls will fail. Add teller_certificate.pem and teller_private_key.pem to artifacts/api-server/certs/");
    return undefined;
  }

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
    throw new Error("Teller mTLS is not configured — place teller_certificate.pem and teller_private_key.pem in artifacts/api-server/certs/");
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
