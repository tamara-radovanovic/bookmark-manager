import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthCredentialsInput } from "@bookmark-manager/shared";
import * as authService from "../services/auth.service";
import { setAccessToken } from "../services/token-store";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentialsInput) => Promise<void>;
  register: (credentials: AuthCredentialsInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Starts true: on first load we don't yet know if the httpOnly refresh
  // cookie is still valid, so ProtectedRoute must wait for the answer
  // instead of redirecting to /login before we've even asked.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .refresh()
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch(() => {
        setAccessToken(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (credentials: AuthCredentialsInput) => {
    const { access_token } = await authService.login(credentials);
    setAccessToken(access_token);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (credentials: AuthCredentialsInput) => {
    const { access_token } = await authService.register(credentials);
    setAccessToken(access_token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Co-locating the hook with its Context/Provider is the standard pattern;
// this only affects Fast Refresh's dev-mode hot-reload, not runtime correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
