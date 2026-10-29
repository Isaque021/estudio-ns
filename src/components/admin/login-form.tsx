"use client";

import { Loader2, LogIn, Scissors } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signIn, type AuthState } from "@/actions/auth";
import { siteConfig } from "@/lib/site-config";

const initialState: AuthState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const params = useSearchParams();
  // Retorno pós-login (ex.: link de gerenciamento de reserva que exigiu
  // login). Só caminho relativo interno; nada de domínios externos.
  const back = params.get("redirect") ?? "";
  const retorno = back.startsWith("/") && !back.startsWith("//") ? back : "";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <Scissors className="size-5" />
          </span>
          <span className="display text-xl text-ink-50">{siteConfig.name}</span>
        </div>

        <div className="card mt-8 p-7">
          <h1 className="display text-2xl text-ink-50">Painel administrativo</h1>
          <p className="mt-2 text-sm text-ink-400">
            Entre com sua conta para gerenciar agendamentos, clientes e pedidos.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            {retorno && <input type="hidden" name="redirect" value={retorno} />}
            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Seu e-mail de acesso"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            {state.status === "error" && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {state.message}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">
            O acesso é exclusivo da equipe do estúdio. Em modo demonstração
            (sem banco configurado), o painel permanece fechado.
          </p>
        </div>
      </div>
    </div>
  );
}
