import "server-only";

import { cache } from "react";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type AdminSession = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  /** Profissional vinculado ao usuário do painel (escopo de agenda). */
  professionalId: string | null;
};

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_users")
    .select("name, role, professional_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "professional"].includes(profile.role)) {
    return null;
  }

  if (profile.role === "professional" && !profile.professional_id) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
    name: profile?.name ?? user.user_metadata?.name ?? user.email ?? "Administrador",
    role: profile?.role ?? "staff",
    professionalId: profile?.professional_id ? String(profile.professional_id) : null,
  };
});

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "admin";
}
