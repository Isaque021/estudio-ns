"use client";

import { Check, Loader2, MessageCircle, Package, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { ensureDdi } from "@/lib/whatsapp";

import { setOrderStatus } from "@/actions/admin";
import {
  formatCreatedAt,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/admin-ui";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "todos" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<OrderStatus, number>();
    for (const order of orders) {
      map.set(order.status, (map.get(order.status) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  function handleChange(order: Order, status: OrderStatus) {
    setPendingId(order.id);
    setMessage(null);
    startTransition(async () => {
      const result = await setOrderStatus(order.id, status);
      setMessage(result.message);
      setPendingId(null);
    });
  }

  return (
    <div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
        {(["todos", ...ORDER_STATUSES] as const).map((status) => (
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
            {status === "todos" ? "Todos" : orderStatusLabel[status]}
            <span className="ml-1.5 text-ink-500">
              {status === "todos" ? orders.length : (counts.get(status) ?? 0)}
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
            Nenhum pedido neste filtro.
          </p>
        )}

        {filtered.map((order) => {
          const busy = pendingId === order.id;
          return (
            <article
              key={order.id}
              className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-brand-400">{order.code}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase",
                        orderStatusClass[order.status],
                      )}
                    >
                      {orderStatusLabel[order.status]}
                    </span>
                    <span className="badge">
                      <Package className="size-3" />
                      Pagamento presencial
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-ink-50">
                    {order.clientName}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink-500">{order.clientPhone}</p>

                  <ul className="mt-3 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.productId} className="flex justify-between gap-4 text-xs">
                        <span className="text-ink-400">
                          <span className="text-brand-400">{item.quantity}x</span>{" "}
                          {item.productName}
                        </span>
                        <span className="text-ink-300">
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.address && (
                    <p className="mt-2 text-xs text-ink-500">Entrega: {order.address}</p>
                  )}
                  {order.notes && (
                    <p className="mt-1 text-xs text-ink-500">Obs.: {order.notes}</p>
                  )}
                  <p className="mt-2 text-[0.65rem] text-ink-600">
                    Recebido em {formatCreatedAt(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="font-display text-2xl text-brand-400">
                    {formatCurrency(order.totalCents)}
                  </span>
                  <a
                    href={`https://wa.me/${ensureDdi(order.clientPhone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:border-[#25d366] hover:text-[#25d366]"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="size-4" />
                  </a>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    {order.status === "pending" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(order, "confirmed")}
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
                    {order.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(order, "ready")}
                        className="flex items-center gap-1.5 rounded-lg border border-sky-600/40 bg-sky-500/10 px-2.5 py-1.5 text-xs text-sky-300 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
                      >
                        <Check className="size-3" />
                        Marcar pronto
                      </button>
                    )}
                    {order.status === "ready" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(order, "delivered")}
                        className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-xs text-ink-200 transition-colors hover:bg-ink-700 disabled:opacity-50"
                      >
                        <Check className="size-3" />
                        Entregue
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        type="button"
                        disabled={busy || isPending}
                        onClick={() => handleChange(order, "cancelled")}
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
