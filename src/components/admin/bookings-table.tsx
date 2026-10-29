"use client";

import { Check, Loader2, MessageCircle, Phone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { setBookingStatus } from "@/actions/admin";
import {
  bookingStatusClass,
  bookingStatusLabel,
  formatCreatedAt,
  formatDateTimeBR,
} from "@/lib/admin-ui";
import {
  formatHoldDeadline,
  isPendingValid,
  pendingValidUntil,
} from "@/lib/schedule";
import type { Booking, BookingStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { ensureDdi } from "@/lib/whatsapp";

type View = "active" | "history";
type StatusFilter = "all" | BookingStatus;

type BookingsTableProps = {
  bookings: Booking[];
  holdMinutes: number;
};

const activeStatuses: BookingStatus[] = ["pending", "confirmed"];
const historyStatuses: BookingStatus[] = [
  "completed",
  "cancelled",
  "no_show",
];

const filterButton =
  "shrink-0 rounded-full border px-3.5 py-2 text-xs transition-colors";

const actionButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors disabled:opacity-50";

function isActive(status: BookingStatus) {
  return status === "pending" || status === "confirmed";
}

export function BookingsTable({
  bookings,
  holdMinutes,
}: BookingsTableProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("active");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [updatedStatuses, setUpdatedStatuses] = useState<
    Record<string, BookingStatus>
  >({});
  const [isPending, startTransition] = useTransition();

  const currentBookings = useMemo(
    () =>
      bookings.map((booking) => ({
        ...booking,
        status: updatedStatuses[booking.id] ?? booking.status,
      })),
    [bookings, updatedStatuses],
  );

  const activeCount = currentBookings.filter((booking) =>
    isActive(booking.status),
  ).length;

  const historyCount = currentBookings.length - activeCount;

  const viewBookings = currentBookings.filter((booking) =>
    view === "active"
      ? isActive(booking.status)
      : !isActive(booking.status),
  );

  const term = search.trim().toLocaleLowerCase("pt-BR");

  const matchingBookings = viewBookings.filter((booking) => {
    const matchesDate = !date || booking.date === date;
    const matchesSearch =
      !term ||
      [
        booking.clientName,
        booking.clientPhone,
        booking.serviceName,
        booking.professionalName,
        booking.code,
      ].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term),
      );

    return matchesDate && matchesSearch;
  });

  const filtered = matchingBookings
    .filter((booking) => filter === "all" || booking.status === filter)
    .sort((a, b) => {
      const first = `${a.date}T${a.time}`;
      const second = `${b.date}T${b.time}`;

      return view === "active"
        ? first.localeCompare(second)
        : second.localeCompare(first);
    });

  const statuses =
    view === "active" ? activeStatuses : historyStatuses;

  function changeView(nextView: View) {
    setView(nextView);
    setFilter("all");
    setSearch("");
    setDate("");
  }

  function handleChange(booking: Booking, status: BookingStatus) {
    if (isPending) return;

    if (
      status === "completed" &&
      !window.confirm(
        `Concluir o atendimento de ${booking.clientName}?\n\nEle sairá de Agendamentos e ficará no Histórico. Use esta opção somente após realizar o atendimento.`,
      )
    ) {
      return;
    }

    if (
      status === "cancelled" &&
      !window.confirm(
        `Cancelar a reserva de ${booking.clientName}?\n\nO horário será liberado e a reserva ficará no Histórico.`,
      )
    ) {
      return;
    }

    setPendingId(booking.id);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await setBookingStatus(booking.id, status);

        if (result.ok) {
          setUpdatedStatuses((current) => ({
            ...current,
            [booking.id]: status,
          }));

          router.refresh();
        }

        setMessage(
          result.ok && status === "completed"
            ? "Atendimento concluído. Você pode consultá-lo no Histórico."
            : result.message,
        );
      } catch {
        setMessage(
          "Não foi possível atualizar. Recarregue a página para conferir a situação da reserva.",
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {[
          {
            value: "active" as const,
            label: "Agendamentos",
            count: activeCount,
          },
          {
            value: "history" as const,
            label: "Histórico",
            count: historyCount,
          },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => changeView(item.value)}
            aria-pressed={view === item.value}
            className={cn(
              "min-h-11 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors",
              view === item.value
                ? "border-brand-500 bg-brand-500/15 text-brand-300"
                : "border-ink-700 text-ink-300 hover:border-brand-600",
            )}
          >
            {item.label}
            <span className="ml-2 text-xs">{item.count}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-400">
        {view === "active"
          ? "Solicitações aguardando confirmação e atendimentos confirmados."
          : "Atendimentos concluídos, reservas canceladas e não comparecimentos."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente, serviço ou código..."
          aria-label="Buscar agendamentos"
          className="input"
        />

        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Filtrar pela data do atendimento"
          className="input"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", ...statuses] as StatusFilter[]).map((status) => {
          const count =
            status === "all"
              ? matchingBookings.length
              : matchingBookings.filter(
                (booking) => booking.status === status,
              ).length;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={cn(
                filterButton,
                filter === status
                  ? "border-brand-500 bg-brand-500/15 text-brand-300"
                  : "border-ink-700 text-ink-300 hover:border-brand-600",
              )}
            >
              {status === "all" ? "Todos" : bookingStatusLabel[status]}
              <span className="ml-1.5 text-ink-500">{count}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300"
        >
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-ink-800 bg-ink-900/40 px-5 py-8 text-center text-sm text-ink-400">
            {view === "active"
              ? "Nenhum agendamento encontrado."
              : "Nenhum atendimento encontrado no histórico."}
          </p>
        )}

        {filtered.map((booking) => {
          const busy = pendingId === booking.id;
          const pending = booking.status === "pending";
          const expired =
            pending && !isPendingValid(booking, holdMinutes);
          const deadline = pending
            ? formatHoldDeadline(
              pendingValidUntil(booking.createdAt, holdMinutes),
            )
            : null;

          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-brand-400">
                      {booking.code}
                    </span>

                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                        bookingStatusClass[booking.status],
                      )}
                    >
                      {bookingStatusLabel[booking.status]}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-ink-50">
                    {booking.serviceName}
                  </h3>

                  <p className="mt-0.5 text-sm text-ink-400">
                    {booking.clientName} · {booking.professionalName}
                  </p>

                  <p className="mt-1 text-xs text-ink-500">
                    {formatDateTimeBR(booking.date, booking.time)}
                    {" · "}
                    {formatCurrency(booking.priceCents)}
                  </p>

                  {booking.notes && (
                    <p className="mt-2 rounded-lg border border-ink-800 bg-ink-950/60 px-3 py-2 text-xs text-ink-400">
                      Observações: {booking.notes}
                    </p>
                  )}

                  <p className="mt-2 text-[0.65rem] text-ink-600">
                    Recebido em {formatCreatedAt(booking.createdAt)}
                  </p>

                  {pending && (
                    <p
                      className={cn(
                        "mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed",
                        expired
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                          : "border-ink-800 bg-ink-950/60 text-ink-400",
                      )}
                    >
                      {expired
                        ? `Prazo encerrado em ${deadline}. O horário foi liberado; uma nova confirmação depende de disponibilidade.`
                        : `Solicitação válida até ${deadline}. Sem confirmação, o horário será liberado.`}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${ensureDdi(booking.clientPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Conversar com ${booking.clientName} no WhatsApp`}
                      className="flex size-10 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-[#25d366] hover:text-[#25d366]"
                    >
                      <MessageCircle aria-hidden className="size-4" />
                    </a>

                    <a
                      href={`tel:${booking.clientPhone}`}
                      aria-label={`Ligar para ${booking.clientName}`}
                      className="flex size-10 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-brand-300"
                    >
                      <Phone aria-hidden className="size-4" />
                    </a>
                  </div>

                  {isActive(booking.status) && (
                    <div className="flex flex-wrap justify-end gap-2">
                      {pending && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleChange(booking, "confirmed")
                          }
                          className={`${actionButton} border-emerald-600/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}
                        >
                          {busy ? (
                            <Loader2
                              aria-hidden
                              className="size-3 animate-spin"
                            />
                          ) : (
                            <Check aria-hidden className="size-3" />
                          )}
                          Confirmar
                        </button>
                      )}

                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleChange(booking, "completed")
                          }
                          className={`${actionButton} border-sky-600/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}
                        >
                          {busy ? (
                            <Loader2
                              aria-hidden
                              className="size-3 animate-spin"
                            />
                          ) : (
                            <Check aria-hidden className="size-3" />
                          )}
                          Concluir
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleChange(booking, "cancelled")
                        }
                        className={`${actionButton} border-red-600/40 bg-red-500/10 text-red-300 hover:bg-red-500/20`}
                      >
                        <X aria-hidden className="size-3" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}