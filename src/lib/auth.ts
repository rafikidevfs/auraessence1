import { ensureSupabaseProfile, isSupabaseConfigured, supabase } from "@/lib/supabase";

export type UserRole = "admin" | "customer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

const AUTH_STORAGE_KEY = "auraessence:auth";

export const DEFAULT_ADMIN_EMAIL = "admin@auraessence.com";

export function toUserRole(value?: string | null): UserRole {
  if (value === "admin" || value === "ADMIN") return "admin";
  return "customer";
}

export function isAdminRole(role?: string | null): boolean {
  return toUserRole(role) === "admin";
}

function buildAuthUser(
  email: string,
  name: string,
  role: UserRole,
  id = `user-${Math.random().toString(36).slice(2, 8)}`,
): AuthUser {
  return {
    id,
    name: name.trim() || (role === "admin" ? "Administrador" : "Cliente"),
    email,
    role,
  };
}

export function createDemoSession(email: string, name: string): AuthSession {
  const role = email.toLowerCase() === DEFAULT_ADMIN_EMAIL ? "admin" : "customer";
  return {
    user: buildAuthUser(email, name, role),
    token: `demo-${Date.now()}`,
  };
}

export async function signInWithPassword(email: string, password: string, name?: string): Promise<AuthSession> {
  if (!email || !password) {
    throw new Error("E-mail e senha são obrigatórios.");
  }

  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Autenticação indisponível: configure o Supabase para habilitar o login.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Não foi possível autenticar o usuário.");

  const profile = await ensureSupabaseProfile(data.user);
  const role = toUserRole(profile?.role ?? "customer");
  const session: AuthSession = {
    user: buildAuthUser(data.user.email ?? email, profile?.full_name ?? name ?? "Usuário", role, data.user.id),
    token: data.session?.access_token ?? `supabase-${Date.now()}`,
  };

  writeAuthSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string, name?: string): Promise<AuthSession> {
  if (!email || !password) {
    throw new Error("E-mail e senha são obrigatórios.");
  }

  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Cadastros indisponíveis: configure o Supabase para criar uma conta.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name ?? "Usuário",
        name: name ?? "Usuário",
      },
    },
  });

  if (error) throw error;

  if (data.session?.access_token) {
    const profile = await ensureSupabaseProfile(data.user ?? undefined);
    const role = toUserRole(profile?.role ?? "customer");
    const session: AuthSession = {
      user: buildAuthUser(data.user?.email ?? email, profile?.full_name ?? name ?? "Usuário", role, data.user?.id ?? `user-${Math.random().toString(36).slice(2, 8)}`),
      token: data.session.access_token,
    };
    writeAuthSession(session);
    return session;
  }

  if (!data.user) throw new Error("Não foi possível criar a conta.");

  const role = toUserRole(
    (data.user.user_metadata?.role as string | undefined) ??
      (data.user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL ? "admin" : "customer"),
  );
  const session: AuthSession = {
    user: buildAuthUser(data.user.email ?? email, data.user.user_metadata?.full_name ?? name ?? "Usuário", role, data.user.id),
    token: `supabase-${Date.now()}`,
  };

  writeAuthSession(session);
  return session;
}

export async function hydrateAuthSession(): Promise<AuthSession | null> {
  if (!supabase || !isSupabaseConfigured) {
    return readAuthSession();
  }

  const result = await supabase.auth.getSession();
  const session = result.data.session;
  const error = result.error;

  if (error || !session?.user) {
    return readAuthSession();
  }

  const profile = await ensureSupabaseProfile(session.user);
  const role = toUserRole(profile?.role ?? "customer");
  const authSession: AuthSession = {
    user: buildAuthUser(session.user.email ?? "", profile?.full_name ?? session.user.user_metadata?.full_name ?? "Usuário", role, session.user.id),
    token: session.access_token,
  };

  writeAuthSession(authSession);
  return authSession;
}

export async function signOutFromSupabase(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getCurrentUser(): AuthUser | null {
  const session = readAuthSession();
  return session?.user ?? null;
}

export function isCurrentUserAdmin(): boolean {
  return isAdminRole(getCurrentUser()?.role);
}
