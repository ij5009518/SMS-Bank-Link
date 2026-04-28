import type { NextFunction, Request, Response } from "express";
import { verifyAdminAccessToken } from "../lib/admin-auth.js";

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

function readBearerToken(req: Request): string | null {
  const authHeader = req.header("authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
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
