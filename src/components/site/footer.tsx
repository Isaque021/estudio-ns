import { AtSign, Clock, Mail, MapPin, Phone, Scissors } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import { navigation } from "@/lib/site-config";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink-800 bg-ink-900/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Scissors className="size-4.5" />
            </span>
            <span className="display text-lg text-ink-50">{siteConfig.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            {siteConfig.description}
          </p>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-brand-300"
          >
            <AtSign className="size-4" />
            {siteConfig.contact.instagram}
          </a>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.2em] text-ink-200 uppercase">
            Navegação
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-brand-300">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className="transition-colors hover:text-brand-300">
                Painel administrativo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.2em] text-ink-200 uppercase">
            Contato
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-400">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <span>
                {siteConfig.address.street}, {siteConfig.address.district}
                <br />
                {siteConfig.address.city} — {siteConfig.address.state}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                className="transition-colors hover:text-brand-300"
              >
                {siteConfig.contact.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="transition-colors hover:text-brand-300"
              >
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-brand-500" />
              <span>Seg a Sex 9h — 21h · Sáb 9h — 19h · Dom 10h — 17h</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-[0.2em] text-ink-200 uppercase">
            Atendimento
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            <li>Agendamento online com confirmação pelo WhatsApp.</li>
            <li>Pagamento sempre presencial, na loja.</li>
            <li>Retirada de produtos na loja ou envio pelos Correios.</li>
          </ul>
          <Link href="/agendar" className="btn btn-ghost mt-5">
            Agendar horário
          </Link>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-500 sm:flex-row">
          <p>
            © {year} {siteConfig.legalName}. Todos os direitos reservados.
          </p>
          <p>
            Feito com Next.js, Tailwind CSS e Supabase — paginação{" "}
            <span className="text-ink-400">presencial</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
