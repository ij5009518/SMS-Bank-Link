import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../lib/tokens.js";

export interface AuthedRequest extends Request {
  auth?: TokenPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

/** Read the verified token payload attached by requireAuth/requireAdmin. */
export function getAuth(req: Request): TokenPayload | undefined {
  return (req as AuthedRequest).auth;
}

/** Requires a valid (user or admin) token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const payload = verifyToken(extractToken(req));
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Please sign in to continue." });
    return;
  }
  (req as AuthedRequest).auth = payload;
  next();
}

/** Requires a valid admin token. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const payload = verifyToken(extractToken(req));
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "unauthorized", message: "Admin access required." });
    return;
  }
  (req as AuthedRequest).auth = payload;
  next();
}

/**
 * Requires that the authenticated user owns the resource identified by the
 * given route param (defaults to `userId`). Admin tokens bypass the check.
 * Must be used after requireAuth.
 */
export function requireSelf(param = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as AuthedRequest).auth;
    if (!auth) {
      res.status(401).json({ error: "unauthorized", message: "Please sign in to continue." });
      return;
    }
    if (auth.role === "admin") {
      next();
      return;
    }
    const target = parseInt(String(req.params[param] ?? ""), 10);
    if (Number.isNaN(target) || auth.sub !== target) {
      res.status(403).json({ error: "forbidden", message: "You don't have access to this resource." });
      return;
    }
    next();
  };
}
