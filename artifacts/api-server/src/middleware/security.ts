import type { Request, RequestHandler, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

type RetryPolicy = {
  key: string;
  maxAttempts: number;
  windowMs: number;
  baseLockMs: number;
  maxLockMs: number;
  message: string;
};

type RetryState = {
  failures: number;
  firstFailureAt: number;
  lockUntil: number;
};

type RateState = {
  count: number;
  resetAt: number;
};

const retryStore = new Map<string, RetryState>();
const rateStore = new Map<string, RateState>();
const DEFAULT_FAILURE_MESSAGE = "Unable to process that request. Please try again.";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function createRouteLimiter(options: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.method}:${req.baseUrl}${req.path}:${clientIp(req)}`;
    const current = rateStore.get(key);

    if (!current || now >= current.resetAt) {
      rateStore.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    current.count += 1;
    rateStore.set(key, current);

    if (current.count > options.max) {
      const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfterSec, 1)));
      return res.status(429).json({
        error: "rate_limited",
        message: options.message ?? "Too many requests. Please try again later.",
      });
    }

    return next();
  };
}

function retryKey(policy: RetryPolicy, req: Request, subject?: string): string {
  const ip = clientIp(req);
  const actor = (subject || "anonymous").trim().toLowerCase();
  return `${policy.key}:${ip}:${actor}`;
}

function getState(key: string): RetryState {
  const now = Date.now();
  const existing = retryStore.get(key);
  if (!existing) {
    const fresh: RetryState = { failures: 0, firstFailureAt: now, lockUntil: 0 };
    retryStore.set(key, fresh);
    return fresh;
  }
  return existing;
}

function gc(state: RetryState, policy: RetryPolicy): void {
  const now = Date.now();
  if (state.failures === 0) return;
  if (now - state.firstFailureAt > policy.windowMs && now >= state.lockUntil) {
    state.failures = 0;
    state.firstFailureAt = now;
    state.lockUntil = 0;
  }
}

export function enforceRetryLockout(req: Request, res: Response, policy: RetryPolicy, subject?: string): boolean {
  const key = retryKey(policy, req, subject);
  const state = getState(key);
  gc(state, policy);

  const now = Date.now();
  if (state.lockUntil > now) {
    const retryAfter = Math.ceil((state.lockUntil - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "temporarily_locked", message: policy.message });
    return true;
  }
  return false;
}

export function recordRetryFailure(req: Request, policy: RetryPolicy, subject?: string): void {
  const key = retryKey(policy, req, subject);
  const state = getState(key);
  const now = Date.now();

  if (now - state.firstFailureAt > policy.windowMs) {
    state.failures = 0;
    state.firstFailureAt = now;
    state.lockUntil = 0;
  }

  state.failures += 1;

  if (state.failures >= policy.maxAttempts) {
    const streak = state.failures - policy.maxAttempts;
    const lockMs = Math.min(policy.baseLockMs * (2 ** streak), policy.maxLockMs);
    state.lockUntil = now + lockMs;
  }

  retryStore.set(key, state);
}

export function clearRetryFailures(req: Request, policy: RetryPolicy, subject?: string): void {
  retryStore.delete(retryKey(policy, req, subject));
}

export const retryPolicies = {
  userLogin: {
    key: "auth-login",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    baseLockMs: 60 * 1000,
    maxLockMs: 30 * 60 * 1000,
    message: "Unable to sign in right now. Please try again shortly.",
  } satisfies RetryPolicy,
  adminLogin: {
    key: "admin-login",
    maxAttempts: 4,
    windowMs: 15 * 60 * 1000,
    baseLockMs: 2 * 60 * 1000,
    maxLockMs: 60 * 60 * 1000,
    message: "Unable to sign in right now. Please try again shortly.",
  } satisfies RetryPolicy,
  otp: {
    key: "otp",
    maxAttempts: 4,
    windowMs: 15 * 60 * 1000,
    baseLockMs: 90 * 1000,
    maxLockMs: 30 * 60 * 1000,
    message: "Too many attempts. Please wait and try again.",
  } satisfies RetryPolicy,
  passwordReset: {
    key: "password-reset",
    maxAttempts: 4,
    windowMs: 20 * 60 * 1000,
    baseLockMs: 2 * 60 * 1000,
    maxLockMs: 60 * 60 * 1000,
    message: DEFAULT_FAILURE_MESSAGE,
  } satisfies RetryPolicy,
};
