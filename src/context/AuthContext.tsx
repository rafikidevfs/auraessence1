import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getCurrentUser,
  hydrateAuthSession,
  signInWithPassword,
  signOutFromSupabase,
  signUpWithPassword,
  type AuthSession,
  type AuthUser,
  type UserRole,
  writeAuthSession,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  role: UserRole;
  isAdmin: boolean;
  signIn: (email: string, password: string, name?: string) => Promise<AuthSession>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  useEffect(() => {
    void hydrateAuthSession().then((session) => {
      if (session?.user) setUser(session.user);
    });
  }, []);

  const signIn = async (email: string, password: string, name?: string) => {
    const session = await signInWithPassword(email, password, name);
    setUser(session.user);
    return session;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const session = await signUpWithPassword(email, password, name);
    setUser(session.user);
    return session;
  };

  const signOut = async () => {
    writeAuthSession(null);
    setUser(null);
    await signOutFromSupabase();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? "customer",
      isAdmin: user?.role === "admin",
      signIn,
      signUp,
      signOut,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
