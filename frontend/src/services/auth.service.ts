import { apiFetch } from "./api";

import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
} from "../types/auth";

import {
  clearStoredSession,
  getActiveAccessToken,
  saveStoredSession,
  USER_KEY,
} from "./session";

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response =
    await apiFetch<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(
          credentials,
        ),
      },
    );

  saveStoredSession(
    response.access_token,
    response.user,
    response.expires_in,
  );

  return response;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const user =
    await apiFetch<AuthUser>(
      "/auth/me",
    );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  return user;
}

export function getStoredUser(): AuthUser | null {
  if (!getActiveAccessToken()) {
    clearStoredSession();
    return null;
  }

  const raw =
    localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(
      USER_KEY,
    );

    return null;
  }
}

export function getToken(): string | null {
  return getActiveAccessToken();
}

export function isAuthenticated(): boolean {
  return Boolean(getActiveAccessToken());
}

export function logout(): void {
  clearStoredSession();
}
