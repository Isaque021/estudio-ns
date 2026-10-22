"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/store/cart-context";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;
  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round((1 - product.priceCents / product.compareAtCents) * 100)
      : 0;

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      1,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link
        href={`/loja/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-ink-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-brand-500 px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-ink-950 uppercase">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-950/85 py-2 text-center text-xs font-semibold tracking-[0.18em] text-ink-300 uppercase">
            Esgotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.65rem] tracking-[0.18em] text-ink-500 uppercase">
          {product.category}
        </p>
        <h3 className="mt-1.5 text-base font-semibold text-ink-50">
          <Link href={`/loja/${product.slug}`} className="hover:text-brand-300">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-400">
          {product.description}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <span className="mr-2 text-sm text-ink-500 line-through">
                {formatCurrency(product.compareAtCents)}
              </span>
            )}
            <span className="font-display text-xl text-brand-400">
              {formatCurrency(product.priceCents)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`btn mt-4 w-full ${added ? "btn-ghost" : "btn-primary"}`}
        >
          {added ? (
            <>
              <Check className="size-4" /> Adicionado
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              {outOfStock ? "Indisponível" : "Adicionar"}
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function QuantityControl({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink-700 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, 0))}
        disabled={value <= 0}
        aria-label="Diminuir quantidade"
        className="flex size-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50 disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-semibold text-ink-50 tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, Math.max(max, 1)))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
        className="flex size-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50 disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
