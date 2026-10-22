import type { Metadata } from "next";
import { Clock, MessageCircle, ShieldCheck } from "lucide-react";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { getBusinessHours, getProfessionals, getServices } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Agendar horário",
  description:
    "Agende seu horário na Barbearia Navalha: escolha serviço, profissional, data e horário e confirme pelo WhatsApp.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; profissional?: string }>;
}) {
  const query = await searchParams;
  const [services, professionals, hours] = await Promise.all([
    getServices(),
    getProfessionals(),
    getBusinessHours(),
  ]);

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Agendamento</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Reserve seu horário
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Quatro passos rápidos: serviço, profissional, data e horário. Ao final, você
          solicita a confirmação pelo WhatsApp e a equipe responde em poucos minutos.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        <BookingWizard
          services={services}
          professionals={professionals}
          hours={hours}
          initialServiceSlug={query.servico}
          initialProfessionalSlug={query.profissional}
        />
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "Leva menos de 1 minuto",
            text: "Só escolher as opções e enviar seus dados.",
          },
          {
            icon: MessageCircle,
            title: "Confirmação pelo WhatsApp",
            text: "A equipe confirma e você recebe o código da reserva.",
          },
          {
            icon: ShieldCheck,
            title: "Sem custo de agendamento",
            text: "O pagamento acontece presencialmente, no atendimento.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-6">
            <item.icon className="size-5 text-brand-400" />
            <h2 className="mt-3 text-sm font-semibold text-ink-50">{item.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{item.text}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-ink-500">
        Precisa de ajuda? Chame a {siteConfig.name} no WhatsApp:{" "}
        {siteConfig.contact.phone}.
      </p>
    </div>
  );
}
