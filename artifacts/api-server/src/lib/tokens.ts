import { createHmac, timingSafeEqual } from "crypto";

// Stateless, HMAC-signed session tokens. No DB table required — the signature
// (keyed by AUTH_SECRET) is what makes a token trustworthy, and an embedded
// expiry bounds its lifetime.

const CONFIGURED_SECRET = process.env.AUTH_SECRET || "";
if (!CONFIGURED_SECRET) {
  console.warn(
    "[Auth] AUTH_SECRET is not set — falling back to an insecure development secret. " +
      "Set AUTH_SECRET in any non-local environment.",
  );
}
const SECRET = CONFIGURED_SECRET || "tb_dev_insecure_secret_change_me";

const USER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (matches device-trust window)
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours (matches admin dashboard session)

export interface TokenPayload {
  sub?: number; // user id (omitted for admin tokens)
  role: "user" | "admin";
  exp: number; // expiry, ms since epoch
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

function signToken(payload: Omit<TokenPayload, "exp">, ttlMs: number): string {
  const full: TokenPayload = { ...payload, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function signUserToken(userId: number): string {
  return signToken({ sub: userId, role: "user" }, USER_TTL_MS);
}

export function signAdminToken(): string {
  return signToken({ role: "admin" }, ADMIN_TTL_MS);
}

export function verifyToken(token: string | undefined | null): TokenPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (payload.role !== "user" && payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}
