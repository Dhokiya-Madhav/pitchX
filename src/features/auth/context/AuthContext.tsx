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
  clearAuthSession,
  getStoredUser,
  getToken,
  setAuthSession,
  type AuthUser,
} from "@/features/auth/lib/authStorage";
import { loginOwnerRequest, loginPlayer, type LoginPayload } from "@/features/auth/api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isOwner: boolean;
  loginPlayer: (payload: LoginPayload) => Promise<void>;
  loginOwner: (payload: LoginPayload) => Promise<void>;
  updateUser: (next: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (t && u) {
      setToken(t);
      setUser(u);
    }
    setIsReady(true);
  }, []);

  const loginPlayerFn = useCallback(async (payload: LoginPayload) => {
    const session = await loginPlayer(payload);
    setAuthSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const loginOwnerFn = useCallback(async (payload: LoginPayload) => {
    const session = await loginOwnerRequest(payload);
    setAuthSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const updateUser = useCallback((next: AuthUser) => {
    const t = getToken();
    if (!t) return;
    setAuthSession({ token: t, user: next });
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isOwner: Boolean(user?.is_owner),
      loginPlayer: loginPlayerFn,
      loginOwner: loginOwnerFn,
      updateUser,
      logout,
    }),
    [user, token, isReady, loginPlayerFn, loginOwnerFn, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
