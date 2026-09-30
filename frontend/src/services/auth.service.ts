import { apiFetch } from "./api";

import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "../types/auth";


const TOKEN_KEY = "access_token";
const USER_KEY = "user";


export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
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
  const user = await apiFetch<AuthUser>(
    "/auth/me",
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  return user;
}


export function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(
    USER_KEY,
  );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser,
    ) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}


export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}


export function isAuthenticated(): boolean {
  return Boolean(
    localStorage.getItem(TOKEN_KEY),
  );
}


export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
