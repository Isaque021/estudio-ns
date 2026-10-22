import { Clock, Scissors } from "lucide-react";

import type { Professional } from "@/lib/types";

export function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <article className="card card-hover overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={professional.photoUrl}
          alt={`Foto de ${professional.name}`}
          className="size-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-5">
        <h3 className="display text-xl text-ink-50">{professional.name}</h3>
        <p className="mt-1 text-xs tracking-[0.14em] text-brand-400 uppercase">
          {professional.role}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">{professional.bio}</p>

        {professional.specialties.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {professional.specialties.map((specialty) => (
              <li key={specialty} className="badge">
                <Scissors className="size-3" />
                {specialty}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ProfessionalRow({ professional }: { professional: Professional }) {
  return (
    <article className="card card-hover flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <div className="size-24 shrink-0 overflow-hidden rounded-full bg-ink-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={professional.photoUrl}
          alt={`Foto de ${professional.name}`}
          className="size-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-ink-50">{professional.name}</h3>
        <p className="text-xs tracking-[0.14em] text-brand-400 uppercase">
          {professional.role}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{professional.bio}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-ink-400">
        <Clock className="size-3.5" />
        {professional.specialties[0] ?? "Barbeiro"}
      </div>
    </article>
  );
}
