"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/site/product-card";
import type { Product } from "@/lib/types";

export function Storefront({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery =
        term === "" ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                category === item
                  ? "border-brand-500 bg-brand-500/15 text-brand-300"
                  : "border-ink-700 text-ink-300 hover:border-brand-600 hover:text-ink-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            className="input pl-10"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-400">
          Nenhum produto encontrado. Tente outro termo.
        </p>
      )}
    </div>
  );
}
