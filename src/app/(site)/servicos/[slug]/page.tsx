import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Check, Clock } from "lucide-react";

import { getServiceBySlug, getServices } from "@/lib/data";
import { resolveServiceSlug } from "@/lib/service-slugs";
import { whatsappServiceSlugs } from "@/lib/booking-policy";
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

  // Só cita valor/duração no SEO quando existem no cadastro.
  const extras = [
    service.priceCents != null ? `Por ${formatCurrency(service.priceCents)}` : null,
    service.durationMin != null ? formatDuration(service.durationMin) : null,
  ].filter(Boolean);
  return {
    title: service.name,
    description: `${service.description}${extras.length ? ` ${extras.join(" — ")}.` : ""}`,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Serviços renomeados mantêm IDs e histórico; quem caiu num endereço
  // antigo (bookmarks, WhatsApp da equipe) é levado à página nova.
  const canonicalSlug = resolveServiceSlug(slug);
  if (canonicalSlug !== slug) {
    redirect(`/servicos/${canonicalSlug}`);
  }

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const whatsappOnly = whatsappServiceSlugs.has(service.slug);
  const canBookOnline = !whatsappOnly && service.priceCents != null && service.durationMin != null;
  const contactPage = whatsappOnly ? "/beleza" : "/barbearia";

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
                "Pagamento presencial no estúdio",
                "Confira os detalhes com a equipe",
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
                {/* Sem preço cadastrado, nada é inventado: só a equipe deve
                    demonstrar o valor ainda não tabelado. */}
                <p className="font-display mt-1 text-4xl text-brand-400">
                  {service.priceCents != null
                    ? formatCurrency(service.priceCents)
                    : "A definir"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-[0.18em] text-ink-500 uppercase">
                  Duração
                </p>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-lg text-ink-100">
                  <Clock className="size-4 text-brand-500" />
                  {service.durationMin != null
                    ? formatDuration(service.durationMin)
                    : "A definir"}
                </p>
              </div>
            </div>

            <div className="divider-gold my-6" />

            <p className="text-sm leading-relaxed text-ink-400">
              O pagamento é feito presencialmente, no local, depois do atendimento.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              {canBookOnline
                ? "Sua solicitação depende da confirmação da equipe."
                : "Combine valores, data e horário diretamente pelo WhatsApp na página a seguir."}
            </p>

            <Link
              href={canBookOnline ? `/agendar?servico=${service.slug}` : contactPage}
              className="btn btn-primary mt-6 w-full"
            >
              {canBookOnline ? "Solicitar agendamento" : "Combinar com a profissional ou equipe"}
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/precos" className="btn btn-ghost mt-2 w-full">
              Ver todos os preços
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
