import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock } from "lucide-react";

import { ProfessionalRow } from "@/components/site/professional-card";
import { getProfessionals, getServiceBySlug, getServices } from "@/lib/data";
import { formatCurrency, formatDuration } from "@/lib/utils";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Serviço não encontrado" };
  return {
    title: service.name,
    description: `${service.description} Por ${formatCurrency(service.priceCents)} — ${formatDuration(service.durationMin)}.`,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const professionals = await getProfessionals();
  const team = professionals.filter((professional) =>
    professional.specialties.includes(service.name),
  );
  const matched = team.length > 0 ? team : professionals;

  return (
    <div className="container-page py-16 lg:py-20">
      <nav className="text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-300">
          Início
        </Link>
        <span className="mx-2">/</span>
        <Link href="/servicos" className="hover:text-brand-300">
          Serviços
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-300">{service.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.imageUrl}
              alt={service.name}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="mt-8">
            <span className="badge">{service.category}</span>
            <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
              {service.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300">
              {service.description}
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Acabamento e styling inclusos",
                "Produtos de Mallory e American Crew",
                "Chá e café por conta da casa",
                "Sem fila para quem agendou",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="card p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs tracking-[0.18em] text-ink-500 uppercase">
                  Valor
                </p>
                <p className="font-display mt-1 text-4xl text-brand-400">
                  {formatCurrency(service.priceCents)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-[0.18em] text-ink-500 uppercase">
                  Duração
                </p>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-lg text-ink-100">
                  <Clock className="size-4 text-brand-500" />
                  {formatDuration(service.durationMin)}
                </p>
              </div>
            </div>

            <div className="divider-gold my-6" />

            <p className="text-sm leading-relaxed text-ink-400">
              O pagamento é feito presencialmente, no local, depois do atendimento.
            </p>

            <Link
              href={`/agendar?servico=${service.slug}`}
              className="btn btn-primary mt-6 w-full"
            >
              Agendar este serviço
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/precos" className="btn btn-ghost mt-2 w-full">
              Ver todos os preços
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-ink-200 uppercase">
              Profissionais disponíveis
            </h2>
            <div className="mt-4 space-y-3">
              {matched.slice(0, 3).map((professional) => (
                <ProfessionalRow key={professional.id} professional={professional} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
