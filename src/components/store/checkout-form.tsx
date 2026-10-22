"use client";

import { ArrowLeft, CircleCheck, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";

import { createOrder, type OrderFormState } from "@/actions/orders";
import { useCart } from "@/components/store/cart-context";
import { formatCurrency } from "@/lib/utils";

const initialState: OrderFormState = { status: "idle", message: "" };

export function CheckoutForm() {
  const { items, totalCents, clear, hydrated } = useCart();
  const [state, formAction, pending] = useActionState(createOrder, initialState);

  useEffect(() => {
    if (state.status === "success") clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.code]);

  if (!hydrated) {
    return <p className="py-20 text-center text-sm text-ink-500">Carregando…</p>;
  }

  if (items.length === 0 && state.status !== "success") {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <h2 className="display text-2xl text-ink-50">Nada para finalizar</h2>
        <p className="mt-3 text-sm text-ink-400">
          Seu carrinho está vazio. Escolha alguns produtos na loja.
        </p>
        <Link href="/loja" className="btn btn-primary mt-7">
          Ver produtos
        </Link>
      </div>
    );
  }

  if (state.status === "success" && state.order) {
    const orderItemCount = state.order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="card mx-auto max-w-2xl p-8 text-center sm:p-12">
        <CircleCheck className="mx-auto size-14 text-brand-400" />
        <h2 className="display mt-6 text-3xl text-ink-50">Pedido registrado!</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-400">
          Agora finalize a compra pelo WhatsApp. A equipe confirma a disponibilidade,
          combina a retirada e faz o pagamento presencial.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-ink-800 bg-ink-900/60 p-6 text-left">
          <dl className="grid gap-3 text-sm">
            {[
              ["Pedido", state.order.code],
              ["Itens", String(orderItemCount)],
              ["Total", formatCurrency(state.order.totalCents)],
              ["Pagamento", "Presencial na retirada"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">{label}</dt>
                <dd className="text-right font-medium text-ink-50">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 space-y-2 border-t border-ink-800 pt-4">
            {state.order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4 text-xs">
                <span className="text-ink-400">
                  {item.quantity}x {item.productName}
                </span>
                <span className="text-ink-300">
                  {formatCurrency(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {state.whatsappUrl && (
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-whatsapp mt-8 w-full sm:w-auto"
          >
            <MessageCircle className="size-4" />
            Finalizar pelo WhatsApp
          </a>
        )}

        <Link href="/loja" className="btn btn-ghost mt-3 w-full sm:w-auto">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const itemsJson = JSON.stringify(
    items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <form action={formAction} className="card p-6 sm:p-8">
        <h2 className="display text-2xl text-ink-50">Seus dados</h2>
        <p className="mt-2 text-sm text-ink-400">
          Usamos essas informações para combinar a retirada e o pagamento.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="checkout-name" className="label">
              Nome completo
            </label>
            <input
              id="checkout-name"
              name="name"
              required
              className="input"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label htmlFor="checkout-phone" className="label">
              WhatsApp
            </label>
            <input
              id="checkout-phone"
              name="phone"
              required
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label htmlFor="checkout-address" className="label">
              Endereço (se quiser envio)
            </label>
            <input
              id="checkout-address"
              name="address"
              className="input"
              placeholder="Opcional"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="checkout-notes" className="label">
              Observações
            </label>
            <textarea
              id="checkout-notes"
              name="notes"
              className="input min-h-24 resize-y"
              placeholder="Ex.: retirar depois das 18h"
            />
          </div>
        </div>

        <input type="hidden" name="items" value={itemsJson} />

        {state.status === "error" && (
          <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {state.message}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/carrinho" className="btn btn-ghost">
            <ArrowLeft className="size-4" />
            Voltar ao carrinho
          </Link>
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Registrar pedido"
            )}
          </button>
        </div>
      </form>

      <aside className="card p-6 lg:sticky lg:top-24">
        <h2 className="display text-xl text-ink-50">Resumo</h2>
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-ink-400">
                <span className="text-brand-400">{item.quantity}x</span> {item.name}
              </span>
              <span className="shrink-0 text-ink-200">
                {formatCurrency(item.priceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="divider-gold my-5" />

        <div className="flex items-end justify-between">
          <span className="text-sm text-ink-400">Total</span>
          <span className="font-display text-3xl text-brand-400">
            {formatCurrency(totalCents)}
          </span>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 text-xs leading-relaxed text-ink-400">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
          Pagamento presencial na loja. Nada é cobrado online.
        </p>
      </aside>
    </div>
  );
}
