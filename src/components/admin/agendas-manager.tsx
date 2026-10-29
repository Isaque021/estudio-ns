"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState } from "react";

import {
  deleteScheduleExceptionAction,
  saveScheduleExceptionAction,
  updateHoldMinutesAction,
  type ActionResult,
} from "@/actions/admin";
import { SCHEDULE_EXCEPTION_KINDS, type Professional, type ScheduleException } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<ScheduleException["kind"], string> = {
  "open-late": "Começar mais tarde",
  "close-early": "Sair mais cedo",
  "extra-window": "Adicionar horário extra",
  "block-range": "Bloquear um intervalo",
  "day-off": "Fechar o dia inteiro (folga)",
};

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function Feedback({ state }: { state: ActionResult | null }) {
  if (!state || !state.message) return null;
  return (
    <p
      aria-live="polite"
      className={cn(
        "rounded-xl border px-4 py-2.5 text-xs",
        state.ok
          ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/40 bg-red-500/10 text-red-300",
      )}
    >
      {state.message}
    </p>
  );
}

export function AgendasManager({
  professionals,
  weekly,
  exceptions,
  holdMinutes,
  canEditSettings = false,
}: {
  professionals: Professional[];
  /** Semana resolvida por profissional: weekday → rótulo do expediente. */
  weekly: Map<string, string[]>;
  exceptions: ScheduleException[];
  holdMinutes: number;
  canEditSettings?: boolean;
}) {
  const [saveState, saveAction, saving] = useActionState(saveScheduleExceptionAction, null);
  const [holdState, holdAction, holding] = useActionState(updateHoldMinutesAction, null);
  const [deleteState, deleteAction, deleting] = useActionState(deleteScheduleExceptionAction, null);

  return (
    <div className="space-y-8">
      {/* Expediente semanal */}
      <div className="grid gap-4 lg:grid-cols-2">
        {professionals.map((professional) => (
          <article key={professional.id} className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
            <h3 className="text-sm font-semibold text-ink-50">{professional.name}</h3>
            <ul className="mt-3 grid gap-1.5 text-xs">
              {(weekly.get(professional.id) ?? WEEKDAY_LABELS.map(() => "—")).map((row, index) => (
                <li key={index} className="flex items-center justify-between gap-3 text-ink-400">
                  <span>{WEEKDAY_LABELS[index]}</span>
                  <span className={row === "Fechado" ? "text-ink-600" : "text-ink-200"}>{row}</span>
                </li>
              ))}
            </ul>
            {exceptions.some((e) => e.professionalId === professional.id) && (
              <div className="mt-4 border-t border-ink-800 pt-3">
                <p className="text-[0.65rem] tracking-wider text-ink-500 uppercase">
                  Ajustes por dia
                </p>
                <ul className="mt-2 space-y-2">
                  {exceptions
                    .filter((e) => e.professionalId === professional.id)
                    .map((exception) => (
                      <li
                        key={exception.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-950/60 px-3 py-2 text-xs text-ink-300"
                      >
                        <span>
                          {exception.date.split("-").reverse().join("/")} ·{" "}
                          {KIND_LABELS[exception.kind]}
                          {exception.startAt && exception.endAt
                            ? ` ${exception.startAt}–${exception.endAt}`
                            : ""}
                          {exception.note ? ` · ${exception.note}` : ""}
                        </span>
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={exception.id} />
                          <button
                            type="submit"
                            disabled={deleting}
                            title="Remover ajuste"
                            className="rounded-md p-1 text-ink-500 transition-colors hover:text-red-300 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </form>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
      <Feedback state={deleteState} />

      {/* Novo ajuste de agenda */}
      <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
        <h2 className="display text-xl text-ink-50">Ajuste de agenda por dia</h2>
        <p className="mt-1 text-xs text-ink-400">
          Exceções pontuais por profissional: deixam de liberar horários no dia
          escolhido. Reservas existentes nunca são canceladas automaticamente.
        </p>
        <form action={saveAction} className="mt-4 space-y-3">
          <Feedback state={saveState} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink-300">
              Profissional
              <select name="professionalId" className="input mt-1" required>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink-300">
              Data
              <input type="date" name="date" required className="input mt-1" />
            </label>
            <label className="text-xs text-ink-300">
              Ajuste
              <select name="kind" className="input mt-1" required>
                {SCHEDULE_EXCEPTION_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-ink-300">
                Início
                <input type="time" name="startAt" className="input mt-1" />
              </label>
              <label className="text-xs text-ink-300">
                Fim
                <input type="time" name="endAt" className="input mt-1" />
              </label>
            </div>
            <label className="text-xs text-ink-300 sm:col-span-2">
              Observação (opcional)
              <input name="note" className="input mt-1" placeholder="Ex.: corte de cabelo da equipe" />
            </label>
          </div>
          <p className="text-[0.65rem] text-ink-500">
            Para folga, deixe início/fim vazios. Para os demais ajustes, preencha
            início e fim.
          </p>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar ajuste"
            )}
          </button>
        </form>
      </section>

      {canEditSettings && (
      <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
        <h2 className="display text-xl text-ink-50">Prazo das solicitações</h2>
        <p className="mt-1 text-xs text-ink-400">
          Tempo em que uma solicitação pendente segura o horário sem confirmação.
          Depois do prazo, ela deixa de bloquear a agenda e só pode ser confirmada
          após revalidação automática.
        </p>
        <form action={holdAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-ink-300">
            Prazo (min)
            <input
              type="number"
              name="holdMinutes"
              min={1}
              max={1440}
              defaultValue={holdMinutes}
              required
              className="input mt-1 w-28"
            />
          </label>
          <button type="submit" disabled={holding} className="btn btn-primary">
            {holding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar prazo"
            )}
          </button>
        </form>
        <div className="mt-3">
          <Feedback state={holdState} />
        </div>
      </section>
      )}
    </div>
  );
}
