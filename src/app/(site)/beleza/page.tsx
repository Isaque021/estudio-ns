import type { Metadata } from "next";

import { SplitTitle } from "@/components/site/split-title";
import {
  ServiceListing,
  type ServiceGroup,
} from "@/components/site/service-listing";
import { getProfessionals, getServices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Unhas & Beleza",
  description:
    "Unhas, unhas de gel e cuidados no Estúdio NS. Combine valores e horários diretamente com a profissional pelo WhatsApp.",
};

export default async function BelezaPage() {
  const [services, professionals] = await Promise.all([
    getServices(),
    getProfessionals(),
  ]);

  const bySlug = new Map(
    services
      .filter((service) => service.active)
      .map((service) => [service.slug, service]),
  );

  const proBySlug = new Map(
    professionals
      .filter((professional) => professional.active)
      .map((professional) => [professional.slug, professional]),
  );

  function item(
    label: string,
    serviceSlug: string,
    professionalSlug: string,
  ) {
    const service = bySlug.get(serviceSlug);

    return {
      label,
      whatsappOnly: true,
      waPhone: proBySlug.get(professionalSlug)?.phone,
      registered: service
        ? {
          slug: service.slug,
          priceCents: service.priceCents,
          durationMin: service.durationMin,
        }
        : undefined,
    };
  }

  const groups: ServiceGroup[] = [
    {
      title: "Isabelly",
      subtitle: "Pé e mão e unhas de gel",
      professionalSlug: "isabelle",
      items: [
        item("Pé e mão", "unhas", "isabelle"),
        item("Unhas de gel", "unhas-de-gel", "isabelle"),
      ],
    },
    {
      title: "Raquel",
      subtitle: "Cuidados e beleza",
      professionalSlug: "raquel",
      items: [
        item("Pedicure", "pedicure", "raquel"),
        item("Calista", "calista", "raquel"),
        item("Depilação", "depilacao", "raquel"),
        item(
          "Design de sobrancelhas",
          "design-de-sobrancelhas",
          "raquel",
        ),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#141518] text-[#f7f4ef]">
      <div className="container-page py-12 sm:py-16">
        <h1 className="display text-4xl sm:text-5xl">
          <SplitTitle text="Unhas & Beleza" tone="dark" />
        </h1>

        <div
          aria-hidden
          className="mt-5 h-1 w-12 rounded-full bg-[#dfad85]"
        />

        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#c7c8ce]">
          Unhas e unhas de gel com Isabelly e os cuidados com Raquel.
          Escolha o serviço e combine valores, data e horário
          diretamente com a profissional pelo WhatsApp.
        </p>

        <ServiceListing groups={groups} tone="graphite" />
      </div>
    </div>
  );
}