import Link from "next/link";

import { formatCurrency } from "@/lib/utils";
import { contactLink } from "@/lib/whatsapp";

export type RegisteredService = {
  slug: string;
  priceCents: number | null;
  durationMin: number | null;
};

export type ServiceItem = {
  label: string;
  registered?: RegisteredService;
  whatsappOnly?: boolean;
  waPhone?: string;
};

export type ServiceGroup = {
  title: string;
  subtitle?: string;
  professionalSlug?: string;
  items: ServiceItem[];
};

type ListingTone = "rose" | "beauty" | "ink" | "graphite";

type ServiceListingProps = {
  groups: ServiceGroup[];
  tone?: ListingTone;
};

const themes = {
  rose: {
    subtitle: "text-[#6f4245]",
    bookingButton: "bg-[#bf8f92] text-[#16161a] hover:bg-[#a87679]",
    contactButton: "border-[#16161a]/20 hover:border-[#8f5659]",
    card: "border-[#16161a]/10 bg-[#f7f2ec]",
    details: "text-[#16161a]/75",
  },
  beauty: {
    subtitle: "text-[#8F4660]",
    bookingButton: "bg-[#8F4660] text-white hover:bg-[#7C3B53]",
    contactButton: "border-[#30262B]/25 hover:border-[#8F4660]",
    card: "border-[#30262B]/10 bg-[#FFFAFB]",
    details: "text-[#30262B]/70",
  },
  ink: {
    subtitle: "text-[#16161a]/80",
    bookingButton: "bg-[#16161a] text-white hover:bg-[#3e3e45]",
    contactButton: "border-[#16161a]/25 hover:border-[#16161a]",
    card: "border-[#16161a]/10 bg-[#f7f2ec]",
    details: "text-[#16161a]/75",
  },
  graphite: {
    subtitle: "text-[#dfad85]",
    bookingButton:
      "border border-[#e4b38e]/40 bg-gradient-to-b from-[#dfad85] to-[#ba7952] text-[#181310] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_#754b34] hover:brightness-110",
    contactButton:
      "border-white/20 text-[#f7f4ef] hover:border-[#dfad85]/60 hover:text-[#dfad85]",
    card:
      "border-white/10 bg-gradient-to-br from-[#27292f] to-[#1c1d22] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_25px_rgba(0,0,0,0.2)]",
    details: "text-[#c7c8ce]",
  },
};

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition-[color,border-color,filter] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85] motion-reduce:transition-none";

export function ServiceListing({
  groups,
  tone = "rose",
}: ServiceListingProps) {
  const theme = themes[tone];

  return (
    <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="display text-2xl">{group.title}</h2>

          {group.subtitle && (
            <p
              className={`mt-2 text-xs font-semibold uppercase tracking-[0.16em] ${theme.subtitle}`}
            >
              {group.subtitle}
            </p>
          )}

          <ul className="mt-5 grid gap-4">
            {group.items.map((item) => {
              const service = item.registered;
              const whatsappOnly = item.whatsappOnly === true;

              const price =
                service?.priceCents != null
                  ? formatCurrency(service.priceCents)
                  : "Consulte valores";

              const duration =
                !whatsappOnly && service?.durationMin != null
                  ? `${service.durationMin} min`
                  : null;

              const details = [price, duration]
                .filter(Boolean)
                .join(" · ");

              const query = new URLSearchParams();

              if (service) {
                query.set("servico", service.slug);
              }

              if (group.professionalSlug) {
                query.set("profissional", group.professionalSlug);
              }

              const contactMessage = whatsappOnly
                ? `Olá, ${group.title}! Gostaria de combinar data, horário e valor para o serviço ${item.label}.`
                : `Olá! Gostaria de saber valores e disponibilidade do serviço ${item.label}.`;

              return (
                <li
                  key={item.label}
                  className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${theme.card}`}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">
                      {item.label}
                    </h3>

                    <p className={`mt-1 text-xs ${theme.details}`}>
                      {details}
                    </p>

                    {whatsappOnly && (
                      <p
                        className={`mt-2 text-xs leading-relaxed ${theme.details}`}
                      >
                        Data e horário combinados diretamente com a
                        profissional.
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {service && !whatsappOnly && (
                      <Link
                        href={`/agendar?${query.toString()}`}
                        className={`${buttonClass} ${theme.bookingButton}`}
                      >
                        Agendar
                      </Link>
                    )}

                    {item.waPhone && (
                      <a
                        href={contactLink(
                          contactMessage,
                          item.waPhone,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className={`${buttonClass} border ${theme.contactButton}`}
                      >
                        {whatsappOnly
                          ? "Combinar pelo WhatsApp"
                          : "WhatsApp"}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}