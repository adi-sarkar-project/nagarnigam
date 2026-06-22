import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, loginUser, registerUser, registerStaff as registerStaffApi } from "@/api/auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  persistStoredUser,
  setStoredSession,
} from "@/lib/auth-storage";
import type { User } from "@/types/app";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  registerStaff: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    const onStorage = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    let isCancelled = false;

    const hydrateSession = async () => {
      try {
        const response = await getCurrentUser();

        if (isCancelled) {
          return;
        }

        persistStoredUser(response.user);
        setUser(response.user);
      } catch {
        if (isCancelled) {
          return;
        }

        clearStoredSession();
        setUser(null);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });
      setStoredSession(response.token, response.user);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed. Please try again."));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await registerUser({ name, email, password });
      return response.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Registration failed. Please try again."));
    }
  };

  const registerStaff = async (name: string, email: string, password: string) => {
    try {
      const response = await registerStaffApi({ name, email, password });
      return response.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Staff registration failed. Please try again."));
    }
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, registerStaff, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
