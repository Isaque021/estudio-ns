import {
  ArrowRight,
  Brush,
  Clock,
  Feather,
  Footprints,
  Hand,
  MapPin,
  Pencil,
  Scissors,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { LogoTilt } from "@/components/site/logo-tilt";
import { SplitTitle } from "@/components/site/split-title";
import { businessHours, siteConfig } from "@/lib/site-config";

const team = [
  {
    name: "Neto",
    skills:
      "Cortes masculinos, barba, nevou, alisamento, hidratação, pezinho e sobrancelha. Também atende cortes de cabelos cacheados femininos.",
  },
  {
    name: "Isaque",
    skills:
      "Cortes masculinos, barba, nevou, alisamento, hidratação, pezinho e sobrancelha.",
  },
  {
    name: "Isabelly",
    skills: "Unhas e unhas de gel.",
  },
  {
    name: "Raquel",
    skills: "Pedicure, calista, depilação e design de sobrancelhas.",
  },
];

const copperButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e4b38e]/40 bg-gradient-to-b from-[#dfad85] to-[#ba7952] px-5 py-3 text-sm font-semibold text-[#181310] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#754b34,0_8px_20px_rgba(0,0,0,0.25)] transition-[transform,box-shadow,filter] hover:brightness-110 active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85] motion-reduce:transition-none motion-reduce:active:translate-y-0";

const card =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-[#27292f] to-[#1c1d22] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(0,0,0,0.2)] transition-[transform,border-color] duration-300 hover:border-[#dfad85]/40 motion-safe:hover:-translate-y-1 motion-reduce:transition-none";

export default function HomePage() {
  return (
    <div className="bg-[#141518] text-[#f7f4ef]">
      <section className="relative">
        <h1 className="sr-only">Estúdio NS</h1>

        <div className="flex justify-center border-b border-white/10 bg-[#191a1e] py-7 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-ns-studio.jpg"
            alt="Logotipo do Estúdio NS"
            width={1254}
            height={1254}
            className="size-32 rounded-full border border-[#dfad85]/40 object-cover shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
          />
        </div>

        <div className="grid md:grid-cols-2">
          <Link
            href="/barbearia"
            className="group relative flex flex-col overflow-hidden bg-[#191b20] px-6 py-12 text-[#f7f2ec] transition-colors hover:bg-[#202228] focus-visible:bg-[#202228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f7f2ec] md:pr-28 sm:px-10 sm:py-12 lg:px-14 lg:pr-32"
          >
            <div
              aria-hidden
              className="depth-a pointer-events-none absolute inset-0 bg-[radial-gradient(100%_90%_at_10%_0%,#44464f_0%,transparent_65%)]"
            />
            <div
              aria-hidden
              className="depth-b pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_88%_94%,rgba(223,173,133,0.13)_0%,transparent_60%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"
            />

            <div className="relative">
              <h2 className="rise display text-4xl tracking-wide lg:text-5xl xl:text-6xl">
                <SplitTitle text="Barbearia" tone="dark" />
              </h2>

              <div
                aria-hidden
                className="mt-5 h-1 w-12 rounded-full bg-[#dfad85]"
              />

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#f7f2ec]/85">
                Corte na máquina e tesoura, degradê navalhado, barba e o combo
                Corte + Barba — todos com Isaque ou Neto.
              </p>

              <p className="mt-2 text-sm font-semibold text-[#f7f2ec]">
                Também atendemos cortes de cabelo cacheado feminino.
              </p>

              <div className="mt-6">
                <span className={copperButton}>Ver serviços</span>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-4">
                {[
                  { icon: Scissors, label: "Máquina e tesoura" },
                  { icon: Zap, label: "Degradê navalhado" },
                  { icon: Waves, label: "Barba" },
                  { icon: Sparkles, label: "Corte cacheado feminino" },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 text-sm text-[#f7f2ec]/85"
                  >
                    <item.icon
                      aria-hidden
                      className="size-5 shrink-0 text-[#dfad85]"
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </Link>

          <Link
            href="/beleza"
            className="group relative flex flex-col overflow-hidden bg-[#202126] px-6 py-12 text-[#f7f2ec] transition-colors hover:bg-[#27282e] focus-visible:bg-[#27282e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f7f2ec] md:pl-28 sm:px-10 sm:py-12 lg:pl-32"
          >
            <div
              aria-hidden
              className="depth-a pointer-events-none absolute -right-24 top-8 size-72 rounded-full bg-[#c58d61]/15 blur-2xl"
            />
            <div
              aria-hidden
              className="depth-b pointer-events-none absolute -left-20 bottom-8 size-56 rounded-full bg-[#dfad85]/10 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"
            />

            <div className="relative">
              <h2 className="rise display text-4xl tracking-wide lg:text-5xl xl:text-6xl">
                <SplitTitle text="Unhas & Beleza" tone="dark" />
              </h2>

              <div
                aria-hidden
                className="mt-5 h-1 w-12 rounded-full bg-[#dfad85]"
              />

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#f7f2ec]/85">
                Unhas e unhas de gel com Isabelly e os cuidados com Raquel.
              </p>

              <div className="mt-6">
                <span className={copperButton}>Escolher meu cuidado</span>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-4">
                {[
                  { icon: Hand, label: "Unhas" },
                  { icon: Brush, label: "Unhas de gel" },
                  { icon: Footprints, label: "Pedicure" },
                  { icon: Feather, label: "Calista" },
                  { icon: Zap, label: "Depilação" },
                  { icon: Pencil, label: "Design de sobrancelhas" },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex max-w-[8.5rem] items-center gap-2.5 text-sm leading-snug text-[#f7f2ec]/85"
                  >
                    <item.icon
                      aria-hidden
                      className="size-5 shrink-0 text-[#dfad85]"
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dfad85]/40 bg-[#141518] p-2 shadow-[0_0_0_8px_rgba(223,173,133,0.04),0_20px_50px_rgba(0,0,0,0.5)] md:block">
          <LogoTilt>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-ns-studio.jpg"
              alt=""
              width={1254}
              height={1254}
              className="size-28 object-cover lg:size-36"
            />
          </LogoTilt>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(223,173,133,0.08),transparent_65%)]"
        />

        <div className="container-page relative py-14 sm:py-16">
          <h2 className="rise display text-3xl sm:text-4xl">
            <SplitTitle text="Equipe" tone="dark" />
          </h2>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#c7c8ce]">
            Conheça quem cuida do seu estilo e bem-estar.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {team.map((member) => {
              const Icon =
                member.name === "Isabelly"
                  ? Hand
                  : member.name === "Raquel"
                    ? Sparkles
                    : Scissors;

              return (
                <article
                  key={member.name}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2b2d33] via-[#222429] to-[#191a1e] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_0_#101114,0_20px_35px_rgba(0,0,0,0.3)] transition-[transform,border-color,box-shadow] duration-300 hover:border-[#dfad85]/50 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_0_#101114,0_26px_45px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-2 motion-reduce:transition-none sm:p-7"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#dfad85]/70 to-transparent"
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#dfad85]/5 blur-2xl"
                  />

                  <div className="relative flex size-14 items-center justify-center rounded-2xl border border-[#dfad85]/30 bg-gradient-to-br from-[#45382e] to-[#242226] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_0_#141416,0_8px_16px_rgba(0,0,0,0.25)]">
                    <Icon
                      aria-hidden
                      className="size-6 text-[#dfad85]"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="relative mt-6 display text-2xl tracking-wide">
                    {member.name}
                  </h3>

                  <div
                    aria-hidden
                    className="mt-3 h-1 w-8 rounded-full bg-[#dfad85] transition-[width] duration-300 group-hover:w-14 motion-reduce:transition-none"
                  />

                  <p className="relative mt-4 text-sm leading-relaxed text-[#c7c8ce]">
                    {member.skills}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="container-page py-14 sm:py-16">
          <h2 className="rise display text-3xl sm:text-4xl">
            <SplitTitle text="Localização e horários" tone="dark" />
          </h2>

          <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
            <div className={`${card} p-6 sm:p-8`}>
              <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#dfad85] uppercase">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#dfad85]/30 bg-gradient-to-br from-[#45382e] to-[#242226] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_3px_0_#141416,0_6px_12px_rgba(0,0,0,0.25)]">
                  <MapPin aria-hidden className="size-5" />
                </span>
                Endereço
              </p>

              <p className="mt-4 text-base leading-relaxed">
                {siteConfig.address.street}
                <br />
                CEP {siteConfig.address.zip}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={siteConfig.map.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={copperButton}
                >
                  Como chegar
                </a>

                <Link
                  href="/localizacao"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm text-[#f7f4ef] transition-colors hover:border-[#dfad85]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85]"
                >
                  Página de localização
                </Link>
              </div>
            </div>

            <div className={`${card} p-6 sm:p-8`}>
              <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#dfad85] uppercase">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#dfad85]/30 bg-gradient-to-br from-[#45382e] to-[#242226] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_3px_0_#141416,0_6px_12px_rgba(0,0,0,0.25)]">
                  <Clock aria-hidden className="size-5" />
                </span>
                Horários
              </p>

              <ul className="mt-4 divide-y divide-white/10 text-sm">
                {businessHours.map((day) => (
                  <li
                    key={day.weekday}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="font-medium">{day.label}</span>
                    <span className="text-[#c7c8ce]">
                      {day.closed
                        ? "Fechado"
                        : `${day.opensAt} — ${day.closesAt}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(197,141,97,0.12),transparent_70%)] text-[#f7f4ef]">
        <div className="container-page flex flex-col items-center gap-5 py-12 text-center">
          <h2 className="rise display text-3xl sm:text-4xl">
            <SplitTitle text="Agende seu horário" tone="dark" />
          </h2>

          <p className="text-sm text-[#f7f2ec]/70">
            Escolha o serviço e o profissional e a gente confirma pelo WhatsApp.
          </p>

          <Link
            href="/agendar"
            className={`${copperButton} rise-2`}
          >
            Agendar horário
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}