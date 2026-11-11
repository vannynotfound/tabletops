export type AuthUser = {
  id: number;
  username: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type UserRecord = AuthUser & {
  order_count?: number | string;
};

export type CategoryRecord = {
  id: number;
  name: string;
  description: string | null;
  product_count: number | string;
};

export type ProductRecord = {
  id: number;
  name: string;
  price: number | string;
  category_id: number | null;
  category_name: string | null;
};

export type OrderRecord = {
  id: number;
  user_id: number;
  username: string;
  product_id: number;
  product_name: string;
  price: number | string;
  category_name: string | null;
  quantity: number | string;
  total_price: number | string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://api-multi-db-tables.onrender.com").replace(/\/+$/, "");
const SESSION_KEY = "tabletop.session";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
let refreshInFlight: Promise<AuthSession> | null = null;

export function getSession(): AuthSession | null {
  const session = parseSession(getSessionSnapshot());
  if (
    session &&
    (!window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
      !window.localStorage.getItem(REFRESH_TOKEN_KEY))
  ) {
    saveSession(session);
  }
  return session;
}

export function getSessionSnapshot() {
  const saved = window.localStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return saved;

  try {
    const stored = JSON.parse(saved) as { user?: AuthUser; accessToken?: string; refreshToken?: string };
    if (!stored.user) return saved;
    return JSON.stringify({ accessToken, refreshToken, user: stored.user });
  } catch {
    return saved;
  }
}

export function parseSession(saved: string | null): AuthSession | null {
  if (!saved) return null;

  try {
    return JSON.parse(saved) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("tabletop-session-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("tabletop-session-change", callback);
  };
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: session.user }));
  window.dispatchEvent(new Event("tabletop-session-change"));
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("tabletop-session-change"));
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  const payload = await response.json();

  if (!response.ok) {
    clearSession();
    throw new ApiError(getErrorMessage(payload, "Your session has expired. Please sign in again."), response.status);
  }

  const refreshed = {
    ...session,
    accessToken: payload.accessToken as string,
    refreshToken: payload.refreshToken as string,
  };
  saveSession(refreshed);
  return refreshed;
}

function refreshOnce(session: AuthSession) {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession(session).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const isPublicAuthRoute = path === "/auth/login" || path === "/auth/register";
  if (!isPublicAuthRoute && session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Could not reach the API. Check your connection and try again.", 0);
  }

  if (response.status === 401 && !isPublicAuthRoute && session?.refreshToken && !retried) {
    const refreshed = await refreshOnce(session);
    return apiRequest<T>(path, {
      ...init,
      headers: { ...Object.fromEntries(headers.entries()), Authorization: `Bearer ${refreshed.accessToken}` },
    }, true);
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, "The request could not be completed."), response.status);
  }
  return payload as T;
}
