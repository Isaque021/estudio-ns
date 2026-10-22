"use client";

import { Loader2, MessageCircle, Save, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { updateClientNote } from "@/actions/admin";
import { formatCreatedAt } from "@/lib/admin-ui";
import type { Client } from "@/lib/types";
import { formatCurrency, formatPhone } from "@/lib/utils";

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) || client.phone.includes(term),
    );
  }, [clients, query]);

  function handleSave(client: Client) {
    setSavingId(client.id);
    setMessage(null);
    startTransition(async () => {
      const result = await updateClientNote(client.id, drafts[client.id] ?? client.notes ?? "");
      setMessage(result.message);
      setSavingId(null);
    });
  }

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou telefone..."
          aria-label="Buscar cliente"
          className="input pl-10"
        />
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-ink-300">
          {message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-xs tracking-[0.12em] text-ink-500 uppercase">
              <th className="pb-3 font-semibold">Cliente</th>
              <th className="pb-3 font-semibold">Contato</th>
              <th className="pb-3 font-semibold">Agendamentos</th>
              <th className="pb-3 font-semibold">Total gasto</th>
              <th className="pb-3 font-semibold">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/70">
            {filtered.map((client) => (
              <tr key={client.id} className="align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium text-ink-100">{client.name}</p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-600">
                    Cliente desde {formatCreatedAt(client.createdAt)}
                  </p>
                  {client.lastBookingAt && (
                    <p className="mt-0.5 text-[0.65rem] text-ink-500">
                      Última visita: {formatCreatedAt(client.lastBookingAt)}
                    </p>
                  )}
                </td>
                <td className="py-4 pr-4">
                  <p className="text-ink-300">{formatPhone(client.phone)}</p>
                  {client.email && (
                    <p className="mt-0.5 text-xs text-ink-500">{client.email}</p>
                  )}
                  <a
                    href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#25d366] hover:underline"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                </td>
                <td className="py-4 pr-4 font-display text-lg text-ink-100">
                  {client.totalBookings}
                </td>
                <td className="py-4 pr-4 font-display text-lg text-brand-400">
                  {formatCurrency(client.totalSpentCents)}
                </td>
                <td className="py-4">
                  <div className="flex items-start gap-2">
                    <input
                      value={drafts[client.id] ?? client.notes ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [client.id]: event.target.value,
                        }))
                      }
                      placeholder="Anotações..."
                      className="input text-xs"
                      aria-label={`Observações de ${client.name}`}
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSave(client)}
                      aria-label="Salvar observação"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand-600/50 bg-brand-500/10 text-brand-300 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
                    >
                      {savingId === client.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-400">Nenhum cliente encontrado.</p>
      )}
    </div>
  );
}
