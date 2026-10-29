import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";

import { siteConfig } from "@/lib/site-config";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Onde estamos",
  description: `Endereço, mapa e como chegar na ${siteConfig.name}.`,
};

export default function LocationPage() {
  const { address, map } = siteConfig;

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Onde estamos</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          {address.street}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          CEP {address.zip}. Funcionamos de terça a sábado, das 9h às 19h
          (domingo e segunda fechados). Confira o mapa abaixo e abra a rota
          direto pelo Google.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
          <iframe
            title={`Mapa da ${siteConfig.name}`}
            src={map.embedUrl}
            width="100%"
            height="520"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[420px] w-full border-0 grayscale-[0.25] lg:h-full"
          />
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <MapPin className="size-5 text-brand-400" />
            <h2 className="mt-3 text-sm font-semibold text-ink-50">Endereço</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
              {address.street}
              <br />
              CEP {address.zip}
            </p>
            <p className="mt-3 text-xs text-ink-500">
              Aguardando o estúdio complementar número do imóvel e bairro, se
              quiserem exibi-los.
            </p>
            <a
              href={map.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-5 w-full"
            >
              <Navigation className="size-4" />
              Abrir rota no mapa
            </a>
          </div>

          {/* Dados reais do estúdio acabam aqui: sem estimativas de metrô,
              estacionamento ou referências de rua que não confirmamos. */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-50">Facilidades</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li>• Wi-Fi grátis para quem espera na cadeira</li>
              <li>• Banheiro e trocador amplos</li>
              <li>• Acessibilidade: entrada sem degrau</li>
              <li>• Aceitamos PIX, débito, crédito e dinheiro</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 text-center sm:p-12">
        <h2 className="display text-3xl text-ink-50">Vem tomar um café com a gente</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-400">
          Chegou sem hora marcada? A gente encaixa entre um atendimento e outro —
          mas reservar garante a sua cadeira.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/agendar" className="btn btn-primary">
            Agendar horário
          </Link>
          <a
            href={contactLink("Olá! Quero confirmar o endereço de vocês.")}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
