import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="display mt-4 text-5xl text-ink-50 sm:text-6xl">
          Essa página não existe
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400">
          O link pode ter mudado de lugar. Volte para o início ou agende seu horário
          direto.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Voltar ao início
          </Link>
          <Link href="/agendar" className="btn btn-ghost">
            Agendar horário
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
