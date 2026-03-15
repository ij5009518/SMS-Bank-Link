import https from "https";

const TELLER_API_BASE = "https://api.teller.io";
const APP_ID = process.env.TELLER_APPLICATION_ID;
const CERT_PEM = process.env.TELLER_CERTIFICATE;
const KEY_PEM = process.env.TELLER_PRIVATE_KEY;

if (!APP_ID) {
  console.warn("[Teller] TELLER_APPLICATION_ID is not set — Teller routes will return errors");
}

function getTellerAgent() {
  if (!CERT_PEM || !KEY_PEM) {
    return undefined;
  }
  return new https.Agent({
    cert: CERT_PEM.replace(/\\n/g, "\n"),
    key: KEY_PEM.replace(/\\n/g, "\n"),
  });
}

export async function tellerRequest<T>(
  path: string,
  accessToken: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const agent = getTellerAgent();

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(accessToken + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };

  const fetchImpl = await import("node-fetch").then((m) => m.default);

  const response = await fetchImpl(`${TELLER_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    agent,
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
