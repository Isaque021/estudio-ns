"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Informe e-mail e senha." };
  }

  if (!isSupabaseConfigured()) {
    // Modo demonstração: aceita qualquer credencial.
    revalidatePath("/admin", "layout");
    redirect("/admin");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos. Verifique e tente novamente.",
    };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
