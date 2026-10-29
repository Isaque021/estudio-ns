import type { Metadata } from "next";
import { Clock, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BookingWizard } from "@/components/booking/booking-wizard";
import {
  getBusinessHours,
  getProfessionals,
  getServices,
} from "@/lib/data";
import { acceptsOnlineBooking, onlineProfessionalSlugs } from "@/lib/booking-policy";
import { resolveServiceSlug } from "@/lib/service-slugs";

export const metadata: Metadata = {
  title: "Agendar horário",
  description:
    "Escolha seu serviço de barbearia, profissional, data e horário no Estúdio NS e envie a solicitação pelo WhatsApp.",
};

type BookingPageProps = {
  searchParams: Promise<{
    servico?: string;
    profissional?: string;
  }>;
};

const bookingInfo = [
  {
    icon: Clock,
    title: "Escolha seu horário",
    text: "Selecione o serviço, o profissional e um horário disponível.",
  },
  {
    icon: MessageCircle,
    title: "Envie pelo WhatsApp",
    text: "A solicitação gera um código. Envie os detalhes e aguarde a confirmação do profissional.",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento no atendimento",
    text: "Não há cobrança online para solicitar a reserva.",
  },
];

export default async function BookingPage({
  searchParams,
}: BookingPageProps) {
  const query = await searchParams;

  const [services, professionals, hours] = await Promise.all([
    getServices(),
    getProfessionals(),
    getBusinessHours(),
  ]);

  const onlineProfessionals = professionals.filter(
    (professional) =>
      professional.active &&
      onlineProfessionalSlugs.has(professional.slug),
  );

  const onlineServices = services.filter(
    (service) =>
      service.active &&
      onlineProfessionals.some((professional) =>
        acceptsOnlineBooking(professional.slug, service.slug) &&
        professional.specialties.includes(service.name),
      ),
  );

  const requestedService = resolveServiceSlug(query.servico);

  const initialServiceSlug = onlineServices.some(
    (service) => service.slug === requestedService,
  )
    ? requestedService
    : undefined;

  const initialProfessionalSlug = onlineProfessionals.some(
    (professional) => professional.slug === query.profissional,
  )
    ? query.profissional
    : undefined;

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Agendamento</p>

        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Reserve seu horário
        </h1>

        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Escolha o serviço, o profissional, a data e o horário.
          Depois, envie a solicitação pelo WhatsApp e aguarde
          a confirmação.
        </p>

        <p className="mt-5 text-sm leading-relaxed text-ink-400">
          Para pé e mão, unhas de gel e os cuidados com Raquel,{" "}
          <Link
            href="/beleza"
            className="text-brand-400 underline underline-offset-4 hover:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          >
            combine diretamente com a profissional pelo WhatsApp
          </Link>
          .
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        {onlineServices.length > 0 ? (
          <BookingWizard
            services={onlineServices}
            professionals={onlineProfessionals}
            hours={hours}
            initialServiceSlug={initialServiceSlug}
            initialProfessionalSlug={initialProfessionalSlug}
          />
        ) : (
          <p
            role="status"
            className="rounded-2xl border border-ink-800 bg-ink-900/40 p-6 text-center text-sm text-ink-400"
          >
            O agendamento online está indisponível no momento.
            Tente novamente mais tarde.
          </p>
        )}
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {bookingInfo.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6">
            <Icon aria-hidden className="size-5 text-brand-400" />

            <h2 className="mt-3 text-sm font-semibold text-ink-50">
              {title}
            </h2>

            <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}