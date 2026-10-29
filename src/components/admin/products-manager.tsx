"use client";

import { Loader2, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { createProduct, updateProduct } from "@/actions/admin";
import type { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductsManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
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

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const price = Number(data.get("price"));
    const stock = Number(data.get("stock"));
    const compareAt = String(data.get("compareAt") ?? "").trim();
    const compareAtNumber = compareAt ? Number(compareAt) : null;

    if (
      !Number.isFinite(price) || price < 0 || price > 1_000_000 ||
      !Number.isInteger(stock) || stock < 0 || stock > 1_000_000 ||
      (compareAtNumber !== null &&
        (!Number.isFinite(compareAtNumber) || compareAtNumber < 0 || compareAtNumber > 1_000_000))
    ) {
      setMessage("Confira o preço e a quantidade em estoque.");
      return;
    }

    setSavingId("new");
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await createProduct({
          name: String(data.get("name") ?? "").trim(),
          description: String(data.get("description") ?? "").trim(),
          priceCents: Math.round(price * 100),
          compareAtCents: compareAtNumber === null
            ? null
            : Math.round(compareAtNumber * 100),
          stock,
          sku: String(data.get("sku") ?? "").trim(),
          category: String(data.get("category") ?? "").trim(),
        });

        setMessage(result.message);

        if (result.ok) {
          form.reset();
          setShowForm(false);
          router.refresh();
        }
      } catch {
        setMessage("Não foi possível cadastrar o produto. Tente novamente.");
      } finally {
        setSavingId(null);
      }
    });
  }

  function handleSave(product: Product) {
    if (isPending) return;
    setSavingId(product.id);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await updateProduct(product.id, {
          name: String(valueFor(product, "name")),
          description: String(valueFor(product, "description")),
          priceCents: Number(valueFor(product, "priceCents")),
          compareAtCents: valueFor(product, "compareAtCents") === null
            ? null
            : Number(valueFor(product, "compareAtCents")),
          sku: String(valueFor(product, "sku")),
          category: String(valueFor(product, "category")),
          active: Boolean(valueFor(product, "active")),
        });

        setMessage(result.message);
        if (result.ok) router.refresh();
      } catch {
        setMessage("Não foi possível salvar o produto. Tente novamente.");
      } finally {
        setSavingId(null);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-400">
          Cadastre produtos e mantenha os preços e a disponibilidade atualizados.
        </p>
        <button
          type="button"
          disabled={isPending}
          aria-expanded={showForm}
          aria-controls="new-product-form"
          onClick={() => setShowForm((current) => !current)}
          className="btn btn-primary disabled:opacity-50"
        >
          {showForm ? <X aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
          {showForm ? "Fechar cadastro" : "Novo produto"}
        </button>
      </div>

      {showForm && (
        <form
          id="new-product-form"
          onSubmit={handleCreate}
          className="mb-6 rounded-2xl border border-ink-800 bg-ink-900/40 p-5 sm:p-6"
        >
          <h2 className="display text-xl text-ink-50">Novo produto</h2>
          <p className="mt-2 text-sm text-ink-400">
            O produto fica ativo na loja após o cadastro. O estoque pode ser ajustado depois na página Estoque.
          </p>

          <fieldset disabled={isPending} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-ink-300">
              Nome do produto
              <input name="name" required minLength={2} maxLength={120} className="input mt-2" />
            </label>
            <label className="text-sm text-ink-300">
              Código do produto (SKU)
              <input name="sku" maxLength={100} className="input mt-2" placeholder="Ex.: PROD-001" />
            </label>
            <label className="text-sm text-ink-300">
              Preço (R$)
              <input name="price" type="number" min="0" max="1000000" step="0.01" required className="input mt-2" />
            </label>
            <label className="text-sm text-ink-300">
              Preço anterior (R$, opcional)
              <input name="compareAt" type="number" min="0" max="1000000" step="0.01" className="input mt-2" />
            </label>
            <label className="text-sm text-ink-300">
              Estoque inicial
              <input name="stock" type="number" min="0" max="1000000" step="1" defaultValue="0" required className="input mt-2" />
            </label>
            <label className="text-sm text-ink-300">
              Categoria
              <input name="category" maxLength={100} className="input mt-2" placeholder="Ex.: Cabelo" />
            </label>
            <label className="text-sm text-ink-300 sm:col-span-2">
              Descrição
              <textarea name="description" maxLength={5000} rows={3} className="input mt-2 resize-y" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-primary">
                {savingId === "new"
                  ? <Loader2 aria-hidden className="size-4 animate-spin" />
                  : <Save aria-hidden className="size-4" />}
                {savingId === "new" ? "Cadastrando..." : "Cadastrar produto"}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {message && (
        <p role="status" className="mb-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-xs text-ink-300">
          {message}
        </p>
      )}

      {products.length === 0 ? (
        <p className="rounded-2xl border border-ink-800 bg-ink-900/40 px-5 py-8 text-center text-sm text-ink-400">
          Nenhum produto cadastrado. Clique em Novo produto para começar.
        </p>
      ) : (
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
      )}
    </div>
  );
}
