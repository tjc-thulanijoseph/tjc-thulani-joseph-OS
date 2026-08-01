import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "@/services";
import { ROLE_RANK, type AuthSession, type Credentials, type Role } from "@/types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  roles: Role[];
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  atLeast: (role: Role) => boolean;
  signIn: (credentials: Credentials) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = authService.onAuthStateChange((next) => {
      if (active) setSession(next);
    });
    authService.getSession().then((next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: Credentials) => {
    const result = await authService.signIn(credentials);
    if (result.error) return result.error.message;
    setSession(result.data);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = session?.user.roles ?? [];
    const rank = roles.reduce((max, role) => Math.max(max, ROLE_RANK[role] ?? 0), 0);
    return {
      session,
      loading,
      isAuthenticated: Boolean(session),
      roles,
      hasRole: (role) => roles.includes(role),
      hasAnyRole: (candidates) => candidates.some((role) => roles.includes(role)),
      atLeast: (role) => rank >= ROLE_RANK[role],
      signIn,
      signOut,
    };
  }, [session, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
