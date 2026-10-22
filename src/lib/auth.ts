import "server-only";

import { cache } from "react";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type AdminSession = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};

/**
 * Retorna a sessão do administrador autenticado, ou `null`.
 *
 * Quando o Supabase não está configurado (modo demonstração) retorna uma
 * sessão fictícia para permitir navegar no painel sem configuração.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) {
    return { id: "demo-admin", email: "demo@barbearianavalha.com.br", name: "Administrador", role: "admin" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_users")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Sem perfil cadastrado, qualquer usuário autenticado entra como "staff".
  return {
    id: user.id,
    email: user.email ?? null,
    name: profile?.name ?? user.user_metadata?.name ?? user.email ?? "Administrador",
    role: profile?.role ?? "staff",
  };
});

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(session);
}
