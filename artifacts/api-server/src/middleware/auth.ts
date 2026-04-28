import type { NextFunction, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminAccessToken } from "../lib/admin-auth.js";

type SessionRole = "user" | "admin";

type SessionTokenPayload = {
  sub: number;
  role: SessionRole;
  iat: number;
  exp: number;
};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        role: string;
        exp: number;
      };
    }
  }
}

const SESSION_SECRET = process.env.SESSION_TOKEN_SECRET || "textbanks_session_secret_change_me";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);

function base64UrlEncode(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
}

function unauthorized(res: Response) {
  return res.status(401).json({ error: "unauthorized", message: "Unauthorized" });
}

function forbidden(res: Response) {
  return res.status(403).json({ error: "forbidden", message: "Forbidden" });
}

function readBearerToken(req: Request): string | null {
  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const tokenHeader = req.header("x-session-token");
  return tokenHeader?.trim() || null;
}

export function signSessionToken(input: { userId: number; role: SessionRole; ttlSeconds?: number }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    sub: input.userId,
    role: input.role,
    iat: now,
    exp: now + (input.ttlSeconds ?? SESSION_TTL_SECONDS),
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSig = signPayload(payloadB64);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSig);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SessionTokenPayload;
    if (!payload?.sub || !payload?.role || !payload?.exp || !payload?.iat) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "user" && payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) return unauthorized(res);

  const payload = verifySessionToken(token);
  if (!payload) return unauthorized(res);

  if (payload.role === "admin") {
    req.user = { id: payload.sub, role: "admin" };
    return next();
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
  if (!user) return unauthorized(res);

  req.user = {
    id: user.id,
    role: "user",
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    email: user.email,
  };

  return next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return forbidden(res);
    }
    return next();
  });
}

export function requireSelfOrAdmin(paramName = "userId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (req.user.role === "admin") return next();

    const paramValue = req.params[paramName];
    const rawUserId = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    const routeUserId = Number.parseInt(rawUserId ?? "", 10);
    if (Number.isNaN(routeUserId)) {
      return res.status(400).json({ error: "bad_request", message: "Invalid user ID" });
    }

    if (req.user.id !== routeUserId) {
      return forbidden(res);
    }

    return next();
  };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Missing bearer token." });
  }

  const payload = verifyAdminAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token." });
  }

  req.auth = { sub: payload.sub, role: payload.role, exp: payload.exp };
  next();
  return;
}

export function requireRole(role: "admin") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      return res.status(403).json({ error: "forbidden", message: "Insufficient permissions." });
    }
    next();
    return;
  };
}

export const authErrors = { unauthorized, forbidden };
