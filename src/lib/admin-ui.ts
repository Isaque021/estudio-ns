import type { BookingStatus, OrderStatus } from "@/lib/types";

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const bookingStatusClass: Record<BookingStatus, string> = {
  pending: "border-brand-600/50 bg-brand-500/10 text-brand-300",
  confirmed: "border-emerald-600/40 bg-emerald-500/10 text-emerald-300",
  completed: "border-sky-600/40 bg-sky-500/10 text-sky-300",
  cancelled: "border-red-600/40 bg-red-500/10 text-red-300",
  no_show: "border-ink-600 bg-ink-800 text-ink-300",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  ready: "Pronto para retirada",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const orderStatusClass: Record<OrderStatus, string> = {
  pending: "border-brand-600/50 bg-brand-500/10 text-brand-300",
  confirmed: "border-emerald-600/40 bg-emerald-500/10 text-emerald-300",
  ready: "border-sky-600/40 bg-sky-500/10 text-sky-300",
  delivered: "border-ink-600 bg-ink-800 text-ink-300",
  cancelled: "border-red-600/40 bg-red-500/10 text-red-300",
};

export function formatDateTimeBR(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, (m ?? 1) - 1, d ?? 1));
  return `${formatted} · ${time}`;
}

export function formatCreatedAt(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
