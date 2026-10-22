import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Info } from "lucide-react";

import { getServices } from "@/lib/data";
import { formatCurrency, formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preços",
  description:
    "Tabela completa de preços da barbearia: corte, barba, coloração, cuidados e serviços infantis. Pagamento presencial.",
};

export default async function PricesPage() {
  const services = await getServices();

  const grouped = services.reduce<Record<string, typeof services>>((acc, service) => {
    acc[service.category] = [...(acc[service.category] ?? []), service];
    return acc;
  }, {});

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Preços</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Tabela de preços
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Valores por serviço, já com acabamento e produtos da casa. O pagamento é
          presencial — você paga depois do atendimento, na loja.
        </p>
      </div>

      <div className="mt-12 space-y-12">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="display text-2xl text-ink-50">{category}</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-800">
              {items.map((service, index) => (
                <div
                  key={service.id}
                  className={`flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
                    index > 0 ? "border-t border-ink-800" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-base font-medium text-ink-50">{service.name}</p>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">
                      {service.description}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                      <Clock className="size-3.5" />
                      {formatDuration(service.durationMin)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <span className="font-display text-2xl text-brand-400">
                      {formatCurrency(service.priceCents)}
                    </span>
                    <Link
                      href={`/agendar?servico=${service.slug}`}
                      className="text-xs font-semibold tracking-wider text-ink-300 uppercase transition-colors hover:text-brand-300"
                    >
                      Agendar →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Pagamento presencial",
            text: "Dinheiro, cartão ou Pix na loja, depois do serviço.",
          },
          {
            title: "Sem taxa de agendamento",
            text: "Reservar pelo site não custa nada.",
          },
          {
            title: "Cancelamento flexível",
            text: "Cancele sem custo até 2 horas antes.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-6">
            <h3 className="text-sm font-semibold text-ink-50">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-brand-700/30 bg-brand-500/5 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-400" />
        <p className="text-sm leading-relaxed text-ink-300">
          Serviços em combo como{" "}
          <strong className="font-semibold text-ink-50">Corte + Barba</strong> e{" "}
          <strong className="font-semibold text-ink-50">Degradê</strong> podem ter
          valores especiais para clientes frequentes. Fale com a gente pelo WhatsApp e
          peça seu pacote.
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/agendar" className="btn btn-primary">
          Agendar meu horário
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
