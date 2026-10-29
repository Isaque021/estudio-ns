import { Clock, Scissors } from "lucide-react";

import type { Professional } from "@/lib/types";
import { personInitials } from "@/lib/utils";

/** Retrato com iniciais quando não há foto cadastrada — nada inventado. */
function Portrait({
  name,
  photoUrl,
  className,
  initialsClassName,
}: {
  name: string;
  photoUrl: string;
  className: string;
  initialsClassName: string;
}) {
  if (photoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={`Foto de ${name}`}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} ${initialsClassName} flex items-center justify-center bg-ink-800 font-display text-brand-300`}
    >
      {personInitials(name) || "?"}
    </span>
  );
}

export function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <article className="card card-hover overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        <Portrait
          name={professional.name}
          photoUrl={professional.photoUrl}
          className="size-full text-3xl transition-transform duration-500 hover:scale-105"
          initialsClassName=""
        />
      </div>
      <div className="p-5">
        <h3 className="display text-xl text-ink-50">{professional.name}</h3>
        {professional.role && (
          <p className="mt-1 text-xs tracking-[0.14em] text-brand-400 uppercase">
            {professional.role}
          </p>
        )}
        {professional.bio && (
          <p className="mt-3 text-sm leading-relaxed text-ink-400">{professional.bio}</p>
        )}

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
        <Portrait
          name={professional.name}
          photoUrl={professional.photoUrl}
          className="size-full text-2xl"
          initialsClassName=""
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-ink-50">{professional.name}</h3>
        {professional.role && (
          <p className="text-xs tracking-[0.14em] text-brand-400 uppercase">
            {professional.role}
          </p>
        )}
        {professional.bio && (
          <p className="mt-2 text-sm leading-relaxed text-ink-400">{professional.bio}</p>
        )}
      </div>
      {professional.specialties[0] && (
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-ink-400">
          <Clock className="size-3.5" />
          {professional.specialties[0]}
        </div>
      )}
    </article>
  );
}
