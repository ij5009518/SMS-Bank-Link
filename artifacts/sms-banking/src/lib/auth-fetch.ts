// Global fetch interceptor that wires session auth into every /api request.
//
// Why an interceptor instead of editing each call site: the app talks to the
// API both through generated React Query hooks (which use a shared customFetch)
// and through ~40 raw fetch() calls. A single wrapper keeps auth consistent
// across all of them.
//
// Responsibilities:
//   1. Attach `Authorization: Bearer <token>` to same-origin /api requests.
//   2. Capture the `sessionToken` returned by auth endpoints and persist it.
//
// User sessions and admin sessions are kept separate: admin pages use the
// admin token, everything else uses the user token.

const USER_TOKEN_KEY = "tb_token";
const ADMIN_SESSION_KEY = "admin_session"; // must match admin dashboard
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;

export function getUserToken(): string | null {
  try {
    return localStorage.getItem(USER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setUserToken(token: string): void {
  try {
    localStorage.setItem(USER_TOKEN_KEY, token);
  } catch {
    /* ignore storage failures */
  }
}

export function clearUserToken(): void {
  try {
    localStorage.removeItem(USER_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function getAdminToken(): string | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const { token, ts } = JSON.parse(raw) as { token?: string; ts?: number };
    if (!token || !ts || Date.now() - ts > ADMIN_TTL_MS) return null;
    return token;
  } catch {
    return null;
  }
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

function isApiRequest(url: string): boolean {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    return path.startsWith("/api/") || path.includes("/api/");
  } catch {
    return url.includes("/api/");
  }
}

function tokenForRequest(url: string): string | null {
  // Admin dashboard pages operate under the admin session; everything else
  // uses the signed-in user's session (falling back to admin where present).
  const onAdminPage =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  if (onAdminPage) return getAdminToken();
  return getUserToken() ?? getAdminToken();
}

let installed = false;

export function installAuthFetch(): void {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveUrl(input);

    if (isApiRequest(url)) {
      const token = tokenForRequest(url);
      if (token) {
        const headers = new Headers(
          init?.headers ?? (input instanceof Request ? input.headers : undefined),
        );
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        if (input instanceof Request && !init) {
          input = new Request(input, { headers });
        } else {
          init = { ...init, headers };
        }
      }
    }

    const response = await originalFetch(input, init);

    // Capture freshly-issued user session tokens from auth responses.
    if (isApiRequest(url) && response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const clone = response.clone();
          const data = (await clone.json()) as { sessionToken?: unknown };
          if (data && typeof data.sessionToken === "string") {
            setUserToken(data.sessionToken);
          }
        } catch {
          /* non-JSON or parse error — ignore */
        }
      }
    }

    return response;
  };
}
