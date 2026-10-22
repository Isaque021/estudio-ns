"use client";

import { ArrowDown, ArrowUp, Loader2, SlidersHorizontal } from "lucide-react";
import { useState, useTransition } from "react";

import { adjustStock } from "@/actions/admin";
import { formatCreatedAt } from "@/lib/admin-ui";
import type { Product, StockMovement } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StockManager({
  products,
  movements,
}: {
  products: Product[];
  movements: StockMovement[];
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [type, setType] = useState<StockMovement["type"]>("in");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await adjustStock(productId, type, Number(quantity), note);
      setMessage(result.message);
      if (result.ok) {
        setQuantity(1);
        setNote("");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-50">
            <SlidersHorizontal className="size-4 text-brand-400" />
            Movimentar estoque
          </h2>

          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="stock-product" className="label">
                Produto
              </label>
              <select
                id="stock-product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="input"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.stock} un.
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="label">Tipo de movimento</span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "in", label: "Entrada" },
                    { value: "out", label: "Saída" },
                    { value: "adjust", label: "Ajuste" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs transition-colors",
                      type === option.value
                        ? "border-brand-500 bg-brand-500/15 text-brand-300"
                        : "border-ink-700 text-ink-300 hover:border-ink-600",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="stock-quantity" className="label">
                Quantidade
              </label>
              <input
                id="stock-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="stock-note" className="label">
                Observação
              </label>
              <input
                id="stock-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex.: compra do distribuidor"
                className="input"
              />
            </div>

            {message && (
              <p className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-ink-300">
                {message}
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Registrar movimento
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-ink-50">Posição de estoque</h2>
          <ul className="mt-4 space-y-2.5">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 border-b border-ink-800/70 pb-2.5 text-sm last:border-0"
              >
                <span className="min-w-0 truncate text-ink-300">{product.name}</span>
                <span
                  className={cn(
                    "font-display text-lg",
                    product.stock <= 0
                      ? "text-red-300"
                      : product.stock <= 5
                        ? "text-brand-300"
                        : "text-ink-100",
                  )}
                >
                  {product.stock}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
        <h2 className="text-sm font-semibold text-ink-50">Últimas movimentações</h2>
        {movements.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            Ainda não há movimentações registradas.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {movements.map((movement) => (
              <li
                key={movement.id}
                className="flex items-start gap-3 border-b border-ink-800/70 pb-3 last:border-0"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    movement.type === "in"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : movement.type === "out"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-ink-800 text-ink-300",
                  )}
                >
                  {movement.type === "in" ? (
                    <ArrowUp className="size-3.5" />
                  ) : movement.type === "out" ? (
                    <ArrowDown className="size-3.5" />
                  ) : (
                    <SlidersHorizontal className="size-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-200">{movement.productName}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {movement.type === "in"
                      ? "Entrada"
                      : movement.type === "out"
                        ? "Saída"
                        : "Ajuste"}{" "}
                    de {movement.quantity} un.
                    {movement.note ? ` · ${movement.note}` : ""}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-600">
                    {formatCreatedAt(movement.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
