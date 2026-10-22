"use client";

import { useMemo, useState } from "react";

import type { GalleryItem } from "@/lib/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );
  const [active, setActive] = useState("Todas");

  const filtered = useMemo(
    () => (active === "Todas" ? items : items.filter((item) => item.category === active)),
    [active, items],
  );

  return (
    <div>
      <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              active === category
                ? "border-brand-500 bg-brand-500/15 text-brand-300"
                : "border-ink-700 text-ink-300 hover:border-brand-600 hover:text-ink-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent p-3">
              <p className="text-sm font-medium text-ink-50">{item.title}</p>
              <p className="text-[0.65rem] tracking-[0.14em] text-brand-400 uppercase">
                {item.category}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
