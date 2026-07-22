import { supabase } from "./supabase";

export async function signInWithBackend(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error("Credenciais inválidas.");
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signUpWithBackend(email: string, password: string, fullName: string) {
  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
      },
    },
  });

  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error("Não foi possível criar a conta. Confirme o e-mail ou tente novamente.");
  }

  return {
    user: data.user,
    session: data.session,
  };
}
