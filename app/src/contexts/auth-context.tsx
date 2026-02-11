"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, TokenResponse } from "@/types/auth";
import { logout as logoutApi } from "@/lib/auth-api";
import { clearTokens } from "@/lib/auth-fetch";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (tokens: TokenResponse, user?: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          clearTokens();
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (tokens: TokenResponse, userInfo?: AuthUser) => {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      if (userInfo) {
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);
      } else {
        // Decode user info from JWT payload
        try {
          const payload = JSON.parse(
            atob(tokens.accessToken.split(".")[1])
          );
          const u: AuthUser = {
            username: payload.username || payload.sub || "",
            email: payload.email || payload.sub || "",
          };
          localStorage.setItem("user", JSON.stringify(u));
          setUser(u);
        } catch {
          // Fallback: set minimal user
          const u: AuthUser = { username: "", email: "" };
          localStorage.setItem("user", JSON.stringify(u));
          setUser(u);
        }
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // Ignore logout API errors, still clear local state
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
