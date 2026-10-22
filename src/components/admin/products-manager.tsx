"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { updateProduct } from "@/actions/admin";
import type { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductsManager({ products }: { products: Product[] }) {
  const [drafts, setDrafts] = useState<Record<string, Partial<Product>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function valueFor<T extends keyof Product>(product: Product, key: T): Product[T] {
    const draft = drafts[product.id];
    if (draft && draft[key] !== undefined) return draft[key] as Product[T];
    return product[key];
  }

  function setDraft(id: string, patch: Partial<Product>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function handleSave(product: Product) {
    setSavingId(product.id);
    setMessage(null);
    startTransition(async () => {
      const result = await updateProduct(product.id, {
        name: String(valueFor(product, "name")),
        description: String(valueFor(product, "description")),
        priceCents: Number(valueFor(product, "priceCents")),
        compareAtCents:
          valueFor(product, "compareAtCents") === null
            ? null
            : Number(valueFor(product, "compareAtCents")),
        sku: String(valueFor(product, "sku")),
        category: String(valueFor(product, "category")),
        active: Boolean(valueFor(product, "active")),
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-xs tracking-[0.12em] text-ink-500 uppercase">
              <th className="pb-3 font-semibold">Produto</th>
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Preço</th>
              <th className="pb-3 font-semibold">Estoque</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800/70">
            {products.map((product) => {
              const active = Boolean(valueFor(product, "active"));
              const lowStock = Number(valueFor(product, "stock")) <= 5;

              return (
                <tr key={product.id} className="align-top">
                  <td className="py-4 pr-4">
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          value={String(valueFor(product, "name"))}
                          onChange={(event) =>
                            setDraft(product.id, { name: event.target.value })
                          }
                          className="input"
                          aria-label="Nome do produto"
                        />
                        <textarea
                          value={String(valueFor(product, "description"))}
                          onChange={(event) =>
                            setDraft(product.id, { description: event.target.value })
                          }
                          rows={2}
                          className="input mt-2 resize-y text-xs"
                          aria-label="Descrição do produto"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <input
                      value={String(valueFor(product, "sku"))}
                      onChange={(event) =>
                        setDraft(product.id, { sku: event.target.value })
                      }
                      className="input w-32 font-mono text-xs"
                      aria-label="SKU"
                    />
                    <p className="mt-2 text-[0.65rem] text-ink-500">
                      {product.category}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="w-32">
                      <label className="label">Preço</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(Number(valueFor(product, "priceCents")) / 100).toFixed(2)}
                        onChange={(event) =>
                          setDraft(product.id, {
                            priceCents: Math.round(Number(event.target.value) * 100),
                          })
                        }
                        className="input"
                      />
                    </div>
                    <div className="mt-2 w-32">
                      <label className="label">De (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={
                          valueFor(product, "compareAtCents") === null
                            ? ""
                            : (Number(valueFor(product, "compareAtCents")) / 100).toFixed(2)
                        }
                        onChange={(event) =>
                          setDraft(product.id, {
                            compareAtCents: event.target.value
                              ? Math.round(Number(event.target.value) * 100)
                              : null,
                          })
                        }
                        className="input"
                        placeholder="—"
                      />
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={cn(
                        "font-display text-lg",
                        lowStock ? "text-red-300" : "text-ink-100",
                      )}
                    >
                      {Number(valueFor(product, "stock"))}
                    </span>
                    {lowStock && (
                      <p className="text-[0.65rem] text-red-300">Estoque baixo</p>
                    )}
                    <p className="mt-1 text-[0.65rem] text-ink-500">
                      {formatCurrency(Number(valueFor(product, "priceCents")))}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <button
                      type="button"
                      onClick={() => setDraft(product.id, { active: !active })}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase transition-colors",
                        active
                          ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
                          : "border-ink-600 bg-ink-800 text-ink-400",
                      )}
                    >
                      {active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSave(product)}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-600/50 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-300 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
                    >
                      {savingId === product.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Save className="size-3" />
                      )}
                      Salvar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
