import { ArrowRight, Clock, MapPin, Scissors } from "lucide-react";
import Link from "next/link";

import { addressLines, navigation, siteConfig } from "@/lib/site-config";

const footerLink =
  "transition-colors hover:text-[#dfad85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85]";

const iconBadge =
  "flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#dfad85]/25 bg-gradient-to-br from-[#45382e] to-[#242226] text-[#dfad85] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_3px_0_#101114,0_6px_12px_rgba(0,0,0,0.2)]";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#17181b] text-[#f7f4ef]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dfad85]/50 to-transparent"
      />

      <div className="container-page grid gap-12 py-14 md:grid-cols-3">
        <div>
          <Link
            href="/"
            className={`inline-flex items-center gap-3 ${footerLink}`}
          >
            <span className={iconBadge}>
              <Scissors aria-hidden className="size-5" />
            </span>

            <span className="display text-2xl">{siteConfig.name}</span>
          </Link>

          <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#c7c8ce]">
            Barbearia, unhas e cuidados com a beleza em um só lugar.
          </p>

          <Link
            href="/agendar"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e4b38e]/40 bg-gradient-to-b from-[#dfad85] to-[#ba7952] px-5 py-3 text-sm font-semibold text-[#181310] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#754b34,0_8px_20px_rgba(0,0,0,0.25)] transition-[transform,filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85] motion-safe:active:translate-y-0.5 motion-reduce:transition-none"
          >
            Agendar horário
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <nav aria-label="Navegação do rodapé">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dfad85]">
            Explore o estúdio
          </h2>

          <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-[#c7c8ce]">
            {navigation
              .filter(
                (item) =>
                  item.href !== "/admin" &&
                  !item.href.startsWith("/admin/"),
              )
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dfad85]">
            Visite o estúdio
          </h2>

          <ul className="mt-5 space-y-6 text-sm text-[#c7c8ce]">
            <li className="flex items-start gap-4">
              <span className={iconBadge}>
                <MapPin aria-hidden className="size-5" />
              </span>

              <div className="min-w-0">
                <p className="leading-relaxed">
                  {addressLines.map((line, index) => (
                    <span key={line}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>

                <a
                  href={siteConfig.map.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-2 inline-flex min-h-11 items-center gap-2 text-[#dfad85] ${footerLink}`}
                >
                  Como chegar
                  <ArrowRight aria-hidden className="size-4" />
                </a>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className={iconBadge}>
                <Clock aria-hidden className="size-5" />
              </span>

              <p className="leading-relaxed">
                Terça a sábado, 9h — 19h
                <br />
                Domingo e segunda: fechado
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs leading-relaxed text-[#a8a9b1] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Todos os direitos reservados.
          </p>
          <p>Pagamento presencial no local.</p>
          <Link
            href="/admin/login"
            className="text-[#c7c8ce] transition-colors hover:text-[#dfad85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85]"
          >
            Área da equipe
          </Link>
        </div>
      </div>
    </footer>
  );
}