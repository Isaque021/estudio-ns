"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { updateProfessional } from "@/actions/admin";
import type { Professional } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TeamManager({ professionals }: { professionals: Professional[] }) {
  const [drafts, setDrafts] = useState<Record<string, Partial<Professional>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function valueFor<T extends keyof Professional>(
    professional: Professional,
    key: T,
  ): Professional[T] {
    const draft = drafts[professional.id];
    if (draft && draft[key] !== undefined) return draft[key] as Professional[T];
    return professional[key];
  }

  function setDraft(id: string, patch: Partial<Professional>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function handleSave(professional: Professional) {
    setSavingId(professional.id);
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfessional(professional.id, {
        name: String(valueFor(professional, "name")),
        role: String(valueFor(professional, "role")),
        bio: String(valueFor(professional, "bio")),
        specialties: [...valueFor(professional, "specialties")],
        active: Boolean(valueFor(professional, "active")),
      });
      setMessage(result.message);
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

      <div className="grid gap-4 lg:grid-cols-2">
        {professionals.map((professional) => {
          const active = Boolean(valueFor(professional, "active"));
          const specialties = [...valueFor(professional, "specialties")];

          return (
            <div
              key={professional.id}
              className={cn(
                "rounded-2xl border border-ink-800 bg-ink-900/40 p-5",
                !active && "opacity-60",
              )}
            >
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={professional.photoUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <input
                    value={String(valueFor(professional, "name"))}
                    onChange={(event) =>
                      setDraft(professional.id, { name: event.target.value })
                    }
                    className="input"
                    aria-label="Nome do profissional"
                  />
                  <input
                    value={String(valueFor(professional, "role"))}
                    onChange={(event) =>
                      setDraft(professional.id, { role: event.target.value })
                    }
                    className="input mt-2"
                    aria-label="Função"
                  />
                </div>
              </div>

              <textarea
                value={String(valueFor(professional, "bio"))}
                onChange={(event) => setDraft(professional.id, { bio: event.target.value })}
                rows={3}
                className="input mt-3 resize-y"
                aria-label="Bio"
              />

              <label className="label mt-4">Especialidades (separadas por vírgula)</label>
              <input
                value={specialties.join(", ")}
                onChange={(event) =>
                  setDraft(professional.id, {
                    specialties: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                className="input"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSave(professional)}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-600/50 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-300 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
                >
                  {savingId === professional.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Salvar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setDraft(professional.id, { active: !active })
                  }
                  className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-50 disabled:opacity-50"
                >
                  {active ? "Desativar" : "Ativar"}
                </button>
                <span
                  className={cn(
                    "ml-auto rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase",
                    active
                      ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
                      : "border-ink-600 bg-ink-800 text-ink-400",
                  )}
                >
                  {active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
