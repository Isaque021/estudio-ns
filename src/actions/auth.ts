"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { checkRequestLimits, limitKey } from "@/lib/request-limits";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "error" | "success";
  message: string;
};

function getReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return "/admin";
  }

  try {
    const base = new URL("https://internal.invalid");
    const destination = new URL(value, base);

    if (destination.origin !== base.origin) return "/admin";

    const path = destination.pathname;
    const allowed =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path.startsWith("/gerenciar/");

    if (!allowed) return "/admin";

    return `${path}${destination.search}${destination.hash}`;
  } catch {
    return "/admin";
  }
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (
    typeof emailValue !== "string" ||
    typeof passwordValue !== "string"
  ) {
    return {
      status: "error",
      message: "Informe e-mail e senha.",
    };
  }

  const email = emailValue.trim();
  const password = passwordValue;

  if (!email || !password) {
    return {
      status: "error",
      message: "Informe e-mail e senha.",
    };
  }

  if (email.length > 254 || password.length > 4096) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos. Verifique e tente novamente.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "O acesso ao painel está indisponível no momento.",
    };
  }

  const limitError = await checkRequestLimits([
    { key: "login:global", max: 120, seconds: 300 },
    {
      key: limitKey("login:email", email.toLowerCase()),
      max: 8,
      seconds: 900,
    },
  ]);

  if (limitError) {
    return { status: "error", message: limitError };
  }

  const destination = getReturnPath(formData.get("redirect"));
  const supabase = await createClient();

  const { data: signedIn, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível entrar. Confira os dados e tente novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("admin_users")
    .select("role, professional_id")
    .eq("id", signedIn.user.id)
    .maybeSingle();

  const allowed =
    profile?.role === "admin" ||
    (
      profile?.role === "professional" &&
      Boolean(profile.professional_id)
    );

  if (!allowed) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: "Não foi possível entrar. Confira os dados e tente novamente.",
    };
  }

  revalidatePath("/admin", "layout");
  redirect(destination);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error("Não foi possível sair. Tente novamente.");
    }
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}