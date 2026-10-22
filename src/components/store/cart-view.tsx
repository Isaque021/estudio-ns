"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/store/cart-context";
import { formatCurrency } from "@/lib/utils";

export function CartView() {
  const { items, totalItems, totalCents, setQuantity, removeItem, clear, hydrated } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!hydrated) {
    return <p className="py-20 text-center text-sm text-ink-500">Carregando carrinho…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <ShoppingBag className="mx-auto size-10 text-ink-600" />
        <h2 className="display mt-5 text-2xl text-ink-50">Seu carrinho está vazio</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          Que tal começar pelos produtos que usamos na cadeira? Pomadas, bálsamos,
          shampoos e equipamentos.
        </p>
        <Link href="/loja" className="btn btn-primary mt-7">
          Ir para a loja
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
      <div className="card divide-y divide-ink-800 overflow-hidden">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 p-4 sm:p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="size-20 shrink-0 rounded-xl object-cover"
            />

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/loja/${item.slug}`}
                  className="text-sm font-semibold text-ink-50 hover:text-brand-300"
                >
                  {item.name}
                </Link>
                <span className="font-display text-lg text-brand-400">
                  {formatCurrency(item.priceCents * item.quantity)}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-ink-500">
                {formatCurrency(item.priceCents)} cada
              </p>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-ink-700 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    aria-label="Diminuir"
                    className="flex size-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-ink-50 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    aria-label="Aumentar"
                    className="flex size-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label="Remover item"
                  className="flex items-center gap-1.5 text-xs text-ink-500 transition-colors hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="card p-6 lg:sticky lg:top-24">
        <h2 className="display text-xl text-ink-50">Resumo do pedido</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-ink-400">
            <dt>Itens</dt>
            <dd>{totalItems}</dd>
          </div>
          <div className="flex justify-between text-ink-400">
            <dt>Entrega</dt>
            <dd className="text-brand-300">Retirada na loja</dd>
          </div>
          <div className="flex justify-between text-ink-400">
            <dt>Frete</dt>
            <dd className="text-brand-300">Grátis</dd>
          </div>
        </dl>

        <div className="divider-gold my-5" />

        <div className="flex items-end justify-between">
          <span className="text-sm text-ink-400">Total</span>
          <span className="font-display text-3xl text-brand-400">
            {formatCurrency(totalCents)}
          </span>
        </div>

        <p className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 text-xs leading-relaxed text-ink-400">
          O pagamento é presencial, na retirada. Você finaliza o pedido pelo WhatsApp
          e paga na loja.
        </p>

        {!showCheckout ? (
          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="btn btn-primary mt-5 w-full"
          >
            Finalizar pedido
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <Link href="/checkout" className="btn btn-primary mt-5 w-full">
            Continuar com meus dados
            <ArrowRight className="size-4" />
          </Link>
        )}

        <button
          type="button"
          onClick={clear}
          className="mt-3 w-full text-center text-xs text-ink-500 underline-offset-4 hover:text-red-400 hover:underline"
        >
          Esvaziar carrinho
        </button>
      </aside>
    </div>
  );
}
