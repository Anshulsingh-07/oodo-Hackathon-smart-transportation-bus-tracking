import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { api, setAccessToken } from "../services/api";
import type { User } from "../types/app";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const refreshed = await api.post<{ accessToken: string }>("/auth/refresh");
        setAccessToken(refreshed.data.accessToken);
        await refreshMe();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string; user: User }>("/auth/login", {
      email,
      password,
    });

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setAccessToken("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshMe }),
    [user, isLoading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
