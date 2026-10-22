"use client";

import { useMemo, useState } from "react";

import { ServiceCard } from "@/components/site/service-card";
import type { Service } from "@/lib/types";

export function ServiceFilter({ services }: { services: Service[] }) {
  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(services.map((s) => s.category)))],
    [services],
  );
  const [active, setActive] = useState("Todos");

  const filtered = useMemo(
    () => (active === "Todos" ? services : services.filter((s) => s.category === active)),
    [active, services],
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

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-400">
          Nenhum serviço encontrado nesta categoria.
        </p>
      )}
    </div>
  );
}
