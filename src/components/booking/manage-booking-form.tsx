"use client";

import { Check, Loader2, X } from "lucide-react";
import { useActionState } from "react";

import {
  confirmBookingAction,
  declineBookingAction,
  type BookingManageState,
} from "@/actions/booking-manage";

// Estado inicial dos formulários da tela de gestão (declarado aqui porque
// arquivos "use server" só podem exportar funções assíncronas).
const initialState: BookingManageState = { status: "idle", message: "" };

/**
 * Ações de confirmação/recusa da tela de gestão do link de WhatsApp.
 * Cliques repetidos não duplicam nada: o servidor responde "já estava
 * confirmado/recusado" e o estado do pedido não muda de novo.
 */
function Resultado({ state }: { state: BookingManageState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      aria-live="polite"
      className={
        state.status === "success"
          ? "mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          : "mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      }
    >
      {state.message}
    </p>
  );
}

export function ManageBookingForm({ code, disabled = false }: { code: string; disabled?: boolean }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmBookingAction,
    initialState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBookingAction,
    initialState,
  );
  const pending = confirmPending || declinePending;

  return (
    <div className="mt-6 space-y-4">
      {/* Confirmação */}
      <form action={confirmAction}>
        <input type="hidden" name="code" value={code} />
        <button
          type="submit"
          disabled={pending || disabled}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-base font-semibold text-ink-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:py-5"
        >
          {confirmPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Confirmando…
            </>
          ) : (
            <>
              <Check className="size-5" />
              Confirmar reserva
            </>
          )}
        </button>
        <Resultado state={confirmState} />
      </form>

      {/* Recusa */}
      <form action={declineAction}>
        <input type="hidden" name="code" value={code} />
        <button
          type="submit"
          disabled={pending || disabled}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-400/50 px-6 py-4 text-base font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:py-5"
        >
          {declinePending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Recusando…
            </>
          ) : (
            <>
              <X className="size-5" />
              Recusar pedido
            </>
          )}
        </button>
        <Resultado state={declineState} />
      </form>
    </div>
  );
}