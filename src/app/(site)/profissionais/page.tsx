import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Star } from "lucide-react";

import { ProfessionalCard } from "@/components/site/professional-card";
import { getProfessionals, getServices } from "@/lib/data";

export const metadata: Metadata = {
  title: "Equipe",
  description:
    "Conheça os barbeiros e coloristas da nossa equipe. Escolha quem você quer para o seu atendimento.",
};

export default async function TeamPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()]);

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Equipe</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Quem senta você na cadeira
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Cada profissional tem uma técnica e uma especialidade. Escolha o nome que você
          prefere no momento do agendamento — ou deixe a gente escolher por você.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((professional) => (
          <ProfessionalCard key={professional.id} professional={professional} />
        ))}
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <div className="card p-7">
          <Award className="size-6 text-brand-400" />
          <h2 className="mt-4 text-lg font-semibold text-ink-50">12 anos de casa</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            Todos os profissionais passaram pela formação interna da barbearia, com
            pega, finalização e atendimento.
          </p>
        </div>
        <div className="card p-7">
          <Star className="size-6 text-brand-400" />
          <h2 className="mt-4 text-lg font-semibold text-ink-50">4.9 de avaliação</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            Mais de 3 mil atendimentos avaliados pelos clientes no Google e Instagram.
          </p>
        </div>
        <div className="card p-7">
          <ArrowRight className="size-6 text-brand-400" />
          <h2 className="mt-4 text-lg font-semibold text-ink-50">Escolha no agendamento</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            O profissional aparece como opção na hora de marcar. Sem telefone, sem
            espera.
          </p>
        </div>
      </div>

      <div className="mt-14 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 sm:p-10">
        <h2 className="display text-2xl text-ink-50">Serviços por profissional</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-xs tracking-[0.14em] text-ink-500 uppercase">
                <th className="pb-3 font-semibold">Serviço</th>
                <th className="pb-3 font-semibold">Profissionais</th>
                <th className="pb-3 text-right font-semibold">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/70">
              {services.map((service) => {
                const team = professionals.filter((p) => p.specialties.includes(service.name));
                return (
                  <tr key={service.id}>
                    <td className="py-3 font-medium text-ink-100">{service.name}</td>
                    <td className="py-3 text-ink-400">
                      {team.length > 0 ? team.map((p) => p.name).join(", ") : "Toda a equipe"}
                    </td>
                    <td className="py-3 text-right text-ink-400">{service.durationMin} min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link href="/agendar" className="btn btn-primary">
          Escolher profissional e agendar
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
