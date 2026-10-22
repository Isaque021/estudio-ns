import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { ServiceFilter } from "@/components/site/service-filter";
import { getServices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Corte, barba, coloração, cuidados capilares e serviços infantis. Veja todos os serviços da barbearia com preços e duração.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Serviços</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          O cardápio da cadeira
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Todos os serviços incluem finalização e orientação de styling. Escolha um
          serviço, o profissional preferido e garanta seu horário online.
        </p>
      </div>

      <div className="mt-12">
        <ServiceFilter services={services} />
      </div>

      <div className="mt-16 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 text-center sm:p-12">
        <Sparkles className="mx-auto size-6 text-brand-400" />
        <h2 className="display mt-4 text-3xl text-ink-50">Não sabe o que escolher?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-400">
          Chame no WhatsApp e descreva o que você procura. A gente monta o pacote ideal
          para o seu estilo e agenda tudo em um só lugar.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/agendar" className="btn btn-primary">
            Agendar horário
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/precos" className="btn btn-ghost">
            Ver preços
          </Link>
        </div>
      </div>
    </div>
  );
}
