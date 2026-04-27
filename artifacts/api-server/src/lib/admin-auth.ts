import { createHmac, randomBytes, scrypt, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

function requireEnv(name: "ADMIN_PASSWORD_HASH" | "ADMIN_TOKEN_SECRET" | "ADMIN_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
}

const ADMIN_PASSWORD_HASH = requireEnv("ADMIN_PASSWORD_HASH");
const ADMIN_TOKEN_SECRET = requireEnv("ADMIN_TOKEN_SECRET");
const ADMIN_REFRESH_SECRET = requireEnv("ADMIN_REFRESH_SECRET");
const ADMIN_ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ADMIN_ACCESS_TOKEN_TTL_SECONDS ?? "900");
const ADMIN_REFRESH_TOKEN_TTL_SECONDS = Number(process.env.ADMIN_REFRESH_TOKEN_TTL_SECONDS ?? "604800");

if (!Number.isFinite(ADMIN_ACCESS_TOKEN_TTL_SECONDS) || ADMIN_ACCESS_TOKEN_TTL_SECONDS <= 0) {
  throw new Error("ADMIN_ACCESS_TOKEN_TTL_SECONDS must be a positive number.");
}
if (!Number.isFinite(ADMIN_REFRESH_TOKEN_TTL_SECONDS) || ADMIN_REFRESH_TOKEN_TTL_SECONDS <= 0) {
  throw new Error("ADMIN_REFRESH_TOKEN_TTL_SECONDS must be a positive number.");
}

type AdminRole = "admin";
type AdminTokenType = "access" | "refresh";

type AdminTokenPayload = {
  sub: "admin";
  role: AdminRole;
  typ: AdminTokenType;
  iat: number;
  exp: number;
  jti?: string;
  pv: string;
};

type RefreshSession = {
  exp: number;
  pv: string;
};

const refreshSessions = new Map<string, RefreshSession>();

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64urlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function passwordVersion(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 16);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const scryptHash = ADMIN_PASSWORD_HASH.startsWith("scrypt:")
    ? ADMIN_PASSWORD_HASH.slice("scrypt:".length)
    : ADMIN_PASSWORD_HASH;
  const [salt, storedHex] = scryptHash.split(":");

  if (!salt || !storedHex) {
    return false;
  }

  const stored = Buffer.from(storedHex, "hex");
  const derived = await scryptAsync(password, salt, stored.length) as Buffer;
  return timingSafeEqual(derived, stored);
}

function buildToken(payload: AdminTokenPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64urlEncode(JSON.stringify(header));
  const payloadPart = base64urlEncode(JSON.stringify(payload));
  const signature = sign(`${headerPart}.${payloadPart}`, secret);
  return `${headerPart}.${payloadPart}.${signature}`;
}

function parseToken(token: string, secret: string): AdminTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  const expected = sign(`${headerPart}.${payloadPart}`, secret);
  if (!safeEqualText(signature, expected)) {
    return null;
  }

  let payload: Partial<AdminTokenPayload>;
  try {
    const payloadRaw = base64urlDecode(payloadPart);
    payload = JSON.parse(payloadRaw) as Partial<AdminTokenPayload>;
  } catch {
    return null;
  }
  if (payload.sub !== "admin" || payload.role !== "admin") return null;
  if (!payload.exp || !payload.iat || !payload.typ || !payload.pv) return null;
  if (Date.now() >= payload.exp * 1000) return null;
  if (payload.pv !== passwordVersion(ADMIN_PASSWORD_HASH)) return null;

  return payload as AdminTokenPayload;
}

export function createAdminSessionTokens() {
  const now = Math.floor(Date.now() / 1000);
  const pv = passwordVersion(ADMIN_PASSWORD_HASH);
  const jti = randomBytes(16).toString("hex");

  const accessPayload: AdminTokenPayload = {
    sub: "admin",
    role: "admin",
    typ: "access",
    iat: now,
    exp: now + ADMIN_ACCESS_TOKEN_TTL_SECONDS,
    pv,
  };

  const refreshPayload: AdminTokenPayload = {
    sub: "admin",
    role: "admin",
    typ: "refresh",
    iat: now,
    exp: now + ADMIN_REFRESH_TOKEN_TTL_SECONDS,
    pv,
    jti,
  };

  refreshSessions.set(jti, { exp: refreshPayload.exp, pv });

  return {
    accessToken: buildToken(accessPayload, ADMIN_TOKEN_SECRET),
    refreshToken: buildToken(refreshPayload, ADMIN_REFRESH_SECRET),
    accessTokenExpiresIn: ADMIN_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: ADMIN_REFRESH_TOKEN_TTL_SECONDS,
  };
}

export function verifyAdminAccessToken(token: string): AdminTokenPayload | null {
  const payload = parseToken(token, ADMIN_TOKEN_SECRET);
  if (!payload || payload.typ !== "access") return null;
  return payload;
}

export function rotateAdminRefreshToken(refreshToken: string) {
  const payload = parseToken(refreshToken, ADMIN_REFRESH_SECRET);
  if (!payload || payload.typ !== "refresh" || !payload.jti) return null;

  const session = refreshSessions.get(payload.jti);
  if (!session) return null;

  if (session.pv !== payload.pv || session.exp !== payload.exp || Date.now() >= session.exp * 1000) {
    refreshSessions.delete(payload.jti);
    return null;
  }

  refreshSessions.delete(payload.jti);
  return createAdminSessionTokens();
}

export function revokeAdminRefreshToken(refreshToken: string): void {
  const payload = parseToken(refreshToken, ADMIN_REFRESH_SECRET);
  if (!payload?.jti) return;
  refreshSessions.delete(payload.jti);
}
