import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import * as authApi from "../lib/api/authApi";
import { ApiError } from "../lib/api/http";

type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: authApi.SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<authApi.SessionUser | null>(null);

  async function refreshUser() {
    try {
      const response = await authApi.getMe();
      setUser(response.user);
      setStatus(response.user ? "authenticated" : "anonymous");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setStatus("anonymous");
        return;
      }

      throw error;
    }
  }

  useEffect(() => {
    refreshUser().catch(() => {
      setUser(null);
      setStatus("anonymous");
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async login(email, password) {
        const response = await authApi.login(email, password);
        setUser(response.user);
        setStatus(response.user ? "authenticated" : "anonymous");
      },
      async signup(email, password) {
        const response = await authApi.signup(email, password);

        if (response.user) {
          setUser(response.user);
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("anonymous");
        }

        return {
          requiresEmailConfirmation: response.requiresEmailConfirmation,
        };
      },
      async logout() {
        await authApi.logout();
        setUser(null);
        setStatus("anonymous");
      },
      refreshUser,
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
