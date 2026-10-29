import { Clock } from "lucide-react";
import Link from "next/link";

import type { Service } from "@/lib/types";
import { formatCurrency, formatDuration } from "@/lib/utils";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/servicos/${service.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.imageUrl}
          alt={service.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 badge bg-ink-950/80 backdrop-blur">
          {service.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink-50">{service.name}</h3>
          {/* Sem preço cadastrado, o card fica sem valor — nada inventado. */}
          {service.priceCents != null && (
            <span className="font-display shrink-0 text-lg text-brand-400">
              {formatCurrency(service.priceCents)}
            </span>
          )}
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-400">
          {service.description}
        </p>
        {service.durationMin != null && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
            <Clock className="size-3.5" />
            {formatDuration(service.durationMin)}
          </div>
        )}
      </div>
    </Link>
  );
}
