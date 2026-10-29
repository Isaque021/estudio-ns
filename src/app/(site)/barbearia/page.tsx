import type { Metadata } from "next";
import Link from "next/link";

import { SplitTitle } from "@/components/site/split-title";
import {
  ServiceListing,
  type ServiceGroup,
} from "@/components/site/service-listing";
import { getServices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Barbearia & Cachos",
  description:
    "Máquina e tesoura, degradê navalhado, barba e serviços para cabelos cacheados no Estúdio NS, com agendamento online.",
};

export default async function BarbeariaPage() {
  const services = (await getServices()).filter((service) => service.active);
  const bySlug = new Map(services.map((service) => [service.slug, service]));
  const registered = (slug: string) => {
    const service = bySlug.get(slug);
    if (!service) return undefined;
    return {
      slug: service.slug,
      priceCents: service.priceCents,
      durationMin: service.durationMin,
    };
  };

  // Mapeamento fixo por slug — mudou de nome, continua buscando o cadastro.
  // Os cinco serviços gerais executam com Isaque ou Neto; quem executa
  // aparece na etapa de escolha do profissional, não nos cards. Exclusivos
  // do Neto (cacheados, Platinado e Alisamento) sem "com Neto" no texto.
  // Relaxamento saiu da oferta; Barba designer também (inativa no cadastro).
  const groups: ServiceGroup[] = [
    {
      title: "Masculino",
      items: [
        { label: "Máquina e tesoura", registered: registered("corte-masculino") },
        { label: "Degradê navalhado", registered: registered("degrade-navalhado") },
        // Maquininha segue o fluxo dos demais cortes a partir do card: o
        // wizard pré-seleciona e, na etapa de horário, faz o impedimento
        // aparecer (duração sem cadastro) antes de qualquer slot.
        { label: "Só maquininha — pentes 1 e 2 ou 2 e 3", registered: registered("so-maquininha") },
        { label: "Barba", registered: registered("barba-completa") },
        { label: "Corte + Barba", registered: registered("corte-e-barba") },
      ],
    },
    {
      title: "Cachos & coloração",
      items: [
        {
          label: "Corte de cabelo cacheado feminino",
          registered: registered("corte-cacheado-feminino"),
          // Consulta só por WhatsApp enquanto a duração não existir.
          whatsappOnly: true,
        },
        { label: "Platinado", registered: registered("platinado") },
        {
          label: "Alisamento",
          registered: registered("alisamento"),
          whatsappOnly: true,
        },
      ],
    },
    {
      // Cuidados da BARBEARIA — distinto do "Design de sobrancelhas" da
      // Raquel (área Unhas & Beleza, cadastro próprio). Quem executa este
      // item aparece na etapa de escolha do profissional (executam
      // simultaneamente o Isaque e o Neto, de acordo com o cadastro).
      title: "Cuidados",
      items: [{ label: "Sobrancelha", registered: registered("sobrancelha") }],
    },
  ];

  return (
    <div className="bg-[#d9cfc4] text-[#16161a]">
      <div className="container-page py-12 sm:py-16">
        <div className="rise flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="display text-4xl sm:text-5xl">
            <SplitTitle text="Barbearia & Cachos" tone="ink" />
          </h1>
          <Link
            href="/agendar"
            className="btn bg-[#16161a] text-white transition-colors hover:bg-[#3e3e45]"
          >
            Agendar horário
          </Link>
        </div>
        <p className="rise-2 mt-4 max-w-xl text-base leading-relaxed text-[#16161a]/80">
          Cortes na máquina e tesoura, degradê navalhado e barba — e os serviços
          para cabelos cacheados femininos com a exclusividade do Neto? Tudo no
          agendamento, escolhendo o profissional na hora.
        </p>

        <ServiceListing groups={groups} tone="ink" />

        <p className="mt-10 text-xs text-[#16161a]/75">
          Valores e durações exibidos vêm da tabela de serviços atual. Itens
          novos ainda não cadastrados aparecem como &quot;Consulte valores&quot;.
        </p>
      </div>
    </div>
  );
}
