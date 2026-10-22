import {
  ArrowRight,
  Clock,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";

import { ProfessionalCard } from "@/components/site/professional-card";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { ServiceCard } from "@/components/site/service-card";
import {
  getBusinessHours,
  getGallery,
  getProducts,
  getProfessionals,
  getServices,
} from "@/lib/data";
import { contactLink } from "@/lib/whatsapp";import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const [services, professionals, gallery, products, hours] = await Promise.all([
    getServices(),
    getProfessionals(),
    getGallery(),
    getProducts(),
    getBusinessHours(),
  ]);

  const highlights = services.slice(0, 6);
  const team = professionals.slice(0, 3);
  const storeHighlights = products.slice(0, 3);
  const todayIndex = new Date().getDay();
  const today = hours.find((h) => h.weekday === todayIndex);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/*  Hero                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(192,138,50,0.16),transparent_55%)]"
        />
        <div className="container-page relative grid gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="animate-fade-up">
            <p className="eyebrow">Barbearia tradicional desde 2012</p>
            <h1 className="display mt-4 text-5xl leading-[0.9] text-ink-50 sm:text-6xl lg:text-7xl">
              Corte feito na <span className="text-gradient">tesoura</span>,
              <br />
              barba feita com <span className="text-gradient">navalha</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-400">
              Escolha o serviço, o profissional, a data e o horário pelo site. A gente
              confirma a sua reserva pelo WhatsApp em poucos minutos. Sem fila, sem
              ligação, sem surpresa.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/agendar" className="btn btn-primary">
                Agendar meu horário
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={contactLink(
                  "Olá! Gostaria de tirar uma dúvida sobre os serviços.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                Falar no WhatsApp
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-800 pt-8">
              {[
                { value: "+12", label: "anos de cadeira" },
                { value: "5", label: "barbeiros na equipe" },
                { value: "4.9", label: "nota dos clientes" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="font-display text-3xl text-brand-400">{item.value}</dt>
                  <dd className="mt-1 text-xs tracking-wide text-ink-400 uppercase">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/gallery-01.svg"
                alt="Corte social executado na barbearia"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="card absolute -bottom-6 -left-4 hidden w-60 p-4 shadow-2xl sm:block">
              <div className="flex items-center gap-2 text-brand-400">
                <Clock className="size-4" />
                <span className="text-xs font-semibold tracking-[0.14em] uppercase">
                  Aberto agora
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-300">
                {today && !today.closed
                  ? `Hoje até as ${today.closesAt}`
                  : "Fechado hoje — volte amanhã"}
              </p>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5 fill-brand-500 text-brand-500" />
                ))}
                <span className="ml-1 text-xs text-ink-400">4.9 / 5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-800 bg-ink-900/40 py-4">
          <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs tracking-[0.2em] text-ink-500 uppercase">
            <span>Tesoura &amp; máquina</span>
            <span className="hidden size-1 rounded-full bg-brand-600 sm:block" />
            <span>Navalha &amp; toalha quente</span>
            <span className="hidden size-1 rounded-full bg-brand-600 sm:block" />
            <span>Hidratação &amp; coloração</span>
            <span className="hidden size-1 rounded-full bg-brand-600 sm:block" />
            <span>Produtos selecionados</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Serviços                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="container-page py-20 lg:py-24">
        <SectionHeading
          eyebrow="Serviços"
          title="O que fazemos na cadeira"
          description="Do corte clássico à coloração completa. Todos os serviços incluem acabamento e orientação de styling."
          action={
            <Link href="/servicos" className="btn btn-ghost">
              Ver todos os serviços
              <ArrowRight className="size-4" />
            </Link>
          }
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Diferenciais                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "Agendamento online",
              text: "Escolha serviço, profissional, data e horário em menos de um minuto.",
            },
            {
              icon: ShieldCheck,
              title: "Confirmação pelo WhatsApp",
              text: "A equipe confirma sua reserva e avisa qualquer mudança por aqui.",
            },
            {
              icon: Store,
              title: "Loja física no local",
              text: "Produtos de barbearia à venda com retirada sem custo.",
            },
            {
              icon: Truck,
              title: "Pagamento presencial",
              text: "Você paga na retirada ou no atendimento. Simples e sem burocracia.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <item.icon className="size-6 text-brand-400" />
              <h3 className="mt-4 text-base font-semibold text-ink-50">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Equipe                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="container-page py-20 lg:py-24">
        <SectionHeading
          eyebrow="Equipe"
          title="Quem vai cuidar do seu visual"
          description="Cada profissional tem sua própria técnica e especialidade. Você escolhe — a gente cuida do resto."
          action={
            <Link href="/profissionais" className="btn btn-ghost">
              Conhecer a equipe
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Preços em destaque                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Preços"
                title="Cardápio claro, sem surpresa"
                description="Os valores abaixo já incluem acabamento. O pagamento é feito presencialmente, no local."
              />
              <ul className="mt-8 space-y-3 text-sm text-ink-400">
                {[
                  "Corte e barba finalizados com styling.",
                  "Chá, café e água por conta da casa.",
                  "Fila zero para quem agendou pelo site.",
                  "Cancelamento gratuito até 2h antes.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/precos" className="btn btn-ghost mt-8">
                Ver tabela completa
              </Link>
            </div>

            <div className="card divide-y divide-ink-800 overflow-hidden">
              {services.slice(0, 6).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink-800/40"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-100">{service.name}</p>
                    <p className="text-xs text-ink-500">{service.category}</p>
                  </div>
                  <span className="font-display text-lg text-brand-400">
                    {formatCurrency(service.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Galeria                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="container-page py-20 lg:py-24">
        <SectionHeading
          eyebrow="Galeria"
          title="Trabalhos recentes"
          description="Fotos dos cortes e barbas saídos da nossa cadeira."
          action={
            <Link href="/galeria" className="btn btn-ghost">
              Ver galeria completa
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.slice(0, 8).map((item) => (
            <Link
              key={item.id}
              href="/galeria"
              className="group relative overflow-hidden rounded-2xl border border-ink-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent p-3 text-xs font-medium text-ink-100 opacity-0 transition-opacity group-hover:opacity-100">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Loja                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="container-page py-20">
          <SectionHeading
            eyebrow="Loja"
            title="Produtos que usamos na cadeira"
            description="Reposição, cuidados e equipamentos. Retire na loja ou finalize o pedido pelo WhatsApp com pagamento presencial."
            action={
              <Link href="/loja" className="btn btn-ghost">
                Ir para a loja
                <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {storeHighlights.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  CTA final                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="container-page py-20 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand-700/40 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-950 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(192,138,50,0.18),transparent_60%)]"
          />
          <div className="relative">
            <p className="eyebrow">Pronto para o seu próximo corte?</p>
            <h2 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
              Reserve seu horário em 1 minuto
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-400">
              Serviço, profissional, data e horário. Você escolhe — nós confirmamos pelo
              WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/agendar" className="btn btn-primary">
                <Scissors className="size-4" />
                Agendar agora
              </Link>
              <Link href="/localizacao" className="btn btn-ghost">
                <MapPin className="size-4" />
                Como chegar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
