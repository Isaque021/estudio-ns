"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleService, updateService } from "@/actions/admin";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ServicesManager({ services }: { services: Service[] }) {
  const [drafts, setDrafts] = useState<Record<string, Partial<Service>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function valueFor<T extends keyof Service>(service: Service, key: T): Service[T] {
    const draft = drafts[service.id];
    if (draft && draft[key] !== undefined) return draft[key] as Service[T];
    return service[key];
  }

  function setDraft(id: string, patch: Partial<Service>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function handleSave(service: Service) {
    setSavingId(service.id);
    setMessage(null);
    startTransition(async () => {
      const result = await updateService(service.id, {
        name: String(valueFor(service, "name")),
        description: String(valueFor(service, "description")),
        priceCents: Number(valueFor(service, "priceCents")),
        durationMin: Number(valueFor(service, "durationMin")),
        category: String(valueFor(service, "category")),
        active: Boolean(valueFor(service, "active")),
      });
      setMessage(result.message);
      setSavingId(null);
    });
  }

  function handleToggle(service: Service) {
    setSavingId(service.id);
    startTransition(async () => {
      await toggleService(service.id);
      setSavingId(null);
    });
  }

  return (
    <div>
      {message && (
        <p className="mb-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-ink-300">
          {message}
        </p>
      )}

      <div className="space-y-3">
        {services.map((service) => {
          const active = Boolean(valueFor(service, "active"));
          return (
            <div
              key={service.id}
              className={cn(
                "rounded-2xl border border-ink-800 bg-ink-900/40 p-5",
                !active && "opacity-60",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">{service.category}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase",
                        active
                          ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
                          : "border-ink-600 bg-ink-800 text-ink-400",
                      )}
                    >
                      {active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <input
                    value={String(valueFor(service, "name"))}
                    onChange={(event) => setDraft(service.id, { name: event.target.value })}
                    className="input mt-3"
                    aria-label="Nome do serviço"
                  />

                  <textarea
                    value={String(valueFor(service, "description"))}
                    onChange={(event) =>
                      setDraft(service.id, { description: event.target.value })
                    }
                    rows={2}
                    className="input mt-2 resize-y"
                    aria-label="Descrição do serviço"
                  />
                </div>

                <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-64">
                  <div>
                    <label className="label">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(Number(valueFor(service, "priceCents")) / 100).toFixed(2)}
                      onChange={(event) =>
                        setDraft(service.id, {
                          priceCents: Math.round(Number(event.target.value) * 100),
                        })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Duração (min)</label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={Number(valueFor(service, "durationMin"))}
                      onChange={(event) =>
                        setDraft(service.id, { durationMin: Number(event.target.value) })
                      }
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSave(service)}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-600/50 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-300 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
                >
                  {savingId === service.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Salvar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(service)}
                  className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-50 disabled:opacity-50"
                >
                  {active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
