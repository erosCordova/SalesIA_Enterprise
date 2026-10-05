import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getToken,
  getCurrentUser,
  getStoredUser,
  login as loginRequest,
  logout as clearSession,
} from "./auth.service";

import {
  ACCESS_TOKEN_KEY,
  clearStoredSession,
  getSessionExpiresAt,
} from "./session";

import type {
  AuthUser,
  LoginRequest,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  login: (
    credentials: LoginRequest,
  ) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(
      () => getStoredUser(),
    );

  const [loading, setLoading] =
    useState<boolean>(
      () => Boolean(getToken()),
    );

  const refreshUser =
    useCallback(async () => {
      if (!getToken()) {
        setUser(null);
        return null;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch {
        clearSession();
        setUser(null);
        return null;
      }
    }, []);

  useEffect(() => {
    function handleSessionExpired() {
      clearStoredSession();
      setUser(null);
      setLoading(false);
    }

    function handleStorageChange(event: StorageEvent) {
      if (
        event.key === null
        || (event.key === ACCESS_TOKEN_KEY && event.newValue === null)
      ) {
        handleSessionExpired();
      }
    }

    window.addEventListener("salesia:session-expired", handleSessionExpired);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("salesia:session-expired", handleSessionExpired);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const expiresAt = getSessionExpiresAt();
    if (expiresAt === null) return;

    const timeout = window.setTimeout(() => {
      clearStoredSession();
      setUser(null);
    }, Math.max(0, expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (!getToken()) {
      setLoading(false);

      return () => {
        mounted = false;
      };
    }

    setLoading(true);

    getCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        clearSession();

        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      credentials: LoginRequest,
    ) => {
      const response =
        await loginRequest(
          credentials,
        );

      setUser(response.user);

      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticated:
        Boolean(
          user &&
            getToken(),
        ),
      login,
      refreshUser,
      logout,
    }),
    [
      user,
      loading,
      login,
      refreshUser,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  return context;
}
