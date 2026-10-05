import type { AuthUser } from "../types/auth";

export const ACCESS_TOKEN_KEY = "access_token";
export const USER_KEY = "user";
const EXPIRES_AT_KEY = "session_expires_at";

function expirationFromToken(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload
      .replaceAll("-", "+")
      .replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
      ? decoded.exp * 1000
      : null;
  } catch {
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getSessionExpiresAt(): number | null {
  const saved = Number(localStorage.getItem(EXPIRES_AT_KEY));
  if (Number.isFinite(saved) && saved > 0) return saved;

  const token = getStoredAccessToken();
  if (!token) return null;

  const tokenExpiration = expirationFromToken(token);
  if (tokenExpiration !== null) {
    localStorage.setItem(EXPIRES_AT_KEY, String(tokenExpiration));
  }
  return tokenExpiration;
}

export function isStoredSessionExpired(now = Date.now()): boolean {
  const token = getStoredAccessToken();
  if (!token) return false;

  const expiresAt = getSessionExpiresAt();
  return expiresAt !== null && expiresAt <= now;
}

export function getActiveAccessToken(): string | null {
  if (isStoredSessionExpired()) {
    clearStoredSession();
    return null;
  }
  return getStoredAccessToken();
}

export function saveStoredSession(
  token: string,
  user: AuthUser,
  expiresInSeconds: number | null,
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  const expiration = typeof expiresInSeconds === "number"
    && Number.isFinite(expiresInSeconds)
    && expiresInSeconds > 0
    ? Date.now() + expiresInSeconds * 1000
    : expirationFromToken(token);

  if (expiration !== null) {
    localStorage.setItem(EXPIRES_AT_KEY, String(expiration));
  } else {
    localStorage.removeItem(EXPIRES_AT_KEY);
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}
