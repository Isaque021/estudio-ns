"use client";

import { Check, Loader2, MessageCircle, Phone, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { setBookingStatus } from "@/actions/admin";
import {
  bookingStatusClass,
  bookingStatusLabel,
  formatCreatedAt,
  formatDateTimeBR,
} from "@/lib/admin-ui";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<BookingStatus | "todos">("todos");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "todos" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<BookingStatus, number>();
    for (const booking of bookings) {
      map.set(booking.status, (map.get(booking.status) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  function handleChange(booking: Booking, status: BookingStatus) {
    setPendingId(booking.id);
    setMessage(null);
    startTransition(async () => {
      const result = await setBookingStatus(booking.id, status);
      setMessage(result.message);
      setPendingId(null);
    });
  }

  return (
    <div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
        {(["todos", ...BOOKING_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              filter === status
                ? "border-brand-500 bg-brand-500/15 text-brand-300"
                : "border-ink-700 text-ink-300 hover:border-brand-600",
            )}
          >
            {status === "todos" ? "Todos" : bookingStatusLabel[status]}
            <span className="ml-1.5 text-ink-500">
              {status === "todos" ? bookings.length : (counts.get(status) ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-ink-300">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-ink-800 bg-ink-900/40 px-5 py-8 text-center text-sm text-ink-400">
            Nenhum agendamento neste filtro.
          </p>
        )}

        {filtered.map((booking) => {
          const busy = pendingId === booking.id;
          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-brand-400">{booking.code}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase",
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
                    {formatDateTimeBR(booking.date, booking.time)} ·{" "}
                    {formatCurrency(booking.priceCents)}
                  </p>
                  {booking.notes && (
                    <p className="mt-2 rounded-lg border border-ink-800 bg-ink-950/60 px-3 py-2 text-xs text-ink-400">
                      Obs.: {booking.notes}
                    </p>
                  )}
                  <p className="mt-2 text-[0.65rem] text-ink-600">
                    Recebido em {formatCreatedAt(booking.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${booking.clientPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-[#25d366] hover:text-[#25d366]"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                    <a
                      href={`tel:${booking.clientPhone}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-brand-300"
                      title="Ligar"
                    >
                      <Phone className="size-4" />
                    </a>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    {booking.status !== "confirmed" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(booking, "confirmed")}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Confirmar
                      </button>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(booking, "completed")}
                        className="flex items-center gap-1.5 rounded-lg border border-sky-600/40 bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-300 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
                      >
                        <Check className="size-3" />
                        Concluir
                      </button>
                    )}
                    {booking.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(booking, "cancelled")}
                        className="flex items-center gap-1.5 rounded-lg border border-red-600/40 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <X className="size-3" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
