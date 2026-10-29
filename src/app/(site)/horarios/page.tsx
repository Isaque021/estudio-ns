import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Coffee, Info } from "lucide-react";

import { getBusinessHours } from "@/lib/data";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Horários",
  description:
    "Funcionamento da barbearia: terça a sábado, das 9h às 19h. Domingo e segunda fechados.",
};

export default async function HoursPage() {
  const hours = await getBusinessHours();
  const todayIndex = new Date().getDay();

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Horários</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Quando a porta está aberta
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Terça a sábado, das 9h às 19h (fuso de São Paulo). Domingo e segunda
          a porta está fechada — e a agenda online respeita exatamente isso.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="card overflow-hidden">
          {hours.map((hour, index) => {
            const isToday = hour.weekday === todayIndex;
            return (
              <div
                key={hour.weekday}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${
                  index > 0 ? "border-t border-ink-800" : ""
                } ${isToday ? "bg-brand-500/8" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${isToday ? "text-brand-300" : "text-ink-100"}`}
                  >
                    {hour.label}
                  </span>
                  {isToday && <span className="badge">Hoje</span>}
                </div>
                <span className="text-sm text-ink-400">
                  {hour.closed
                    ? "Fechado"
                    : `${hour.opensAt} às ${hour.closesAt}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <Clock className="size-5 text-brand-400" />
            <h2 className="mt-3 text-sm font-semibold text-ink-50">
              Sobre a agenda online
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-400">
              <li>• Os agendamentos começam a partir do horário de abertura.</li>
              <li>• Cada atendimento reserva o tempo total do serviço.</li>
              <li>• Intervalos de 30 minutos entre um cliente e o próximo.</li>
              <li>• Chegue 5 minutos antes para o café e o registro da ficha.</li>
            </ul>
          </div>

          <div className="card p-6">
            <Coffee className="size-5 text-brand-400" />
            <h2 className="mt-3 text-sm font-semibold text-ink-50">Feriados</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              Em feriados e datas comemorativas o horário pode ser reduzido. O
              nosso WhatsApp avisa as mudanças com antecedência para os clientes
              agendados.
            </p>
          </div>

          <div className="card flex items-start gap-3 p-6">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-400" />
            <p className="text-sm leading-relaxed text-ink-400">
              Precisa de um horário fora do expediente? Chame a gente no WhatsApp que
              tentamos encaixar.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/agendar" className="btn btn-primary">
          Agendar horário
          <ArrowRight className="size-4" />
        </Link>
        <a
          href={contactLink("Olá! Gostaria de saber a disponibilidade de horário de hoje.")}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          Consultar disponibilidade
        </a>
      </div>
    </div>
  );
}
