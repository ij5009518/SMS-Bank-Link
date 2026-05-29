import type { Request, Response, NextFunction } from "express";

// Lightweight in-memory fixed-window rate limiter. Sufficient for a single
// instance; swap for a shared store (Redis) if the API is ever horizontally
// scaled.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = "rl" } = opts;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${keyPrefix}:${clientIp(req)}:${req.path}`;
    const now = Date.now();

    let bucket = store.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      store.set(key, bucket);
    }
    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "rate_limited",
        message: "Too many attempts. Please wait a moment and try again.",
      });
      return;
    }
    next();
  };
}

// Periodically evict expired buckets so the map can't grow unbounded.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 60_000);
cleanup.unref?.();
