import { apiFetch } from "./api";

import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
} from "../types/auth";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

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

  localStorage.setItem(
    TOKEN_KEY,
    response.access_token,
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(response.user),
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
  return localStorage.getItem(
    TOKEN_KEY,
  );
}

export function isAuthenticated(): boolean {
  return Boolean(
    localStorage.getItem(
      TOKEN_KEY,
    ),
  );
}

export function logout(): void {
  localStorage.removeItem(
    TOKEN_KEY,
  );

  localStorage.removeItem(
    USER_KEY,
  );
}
