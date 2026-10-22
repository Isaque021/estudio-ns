import type { Metadata } from "next";
import Link from "next/link";
import { Car, MapPin, Navigation, Train, UtensilsCrossed } from "lucide-react";

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
          Rua das Laranjeiras, 240
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Estamos no coração do Centro, a duas quadras da praça principal. Fachada
          escura, porta de madeira e o letreiro da navalha aceso.
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
              {address.district} — {address.city}/{address.state}
              <br />
              CEP {address.zip}
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

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-50">Como chegar</h2>
            <ul className="mt-4 space-y-3.5 text-sm text-ink-400">
              <li className="flex gap-3">
                <Train className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span>
                  Metrô <strong className="text-ink-200">Linha 1</strong> — estação
                  Central, a 6 minutos a pé.
                </span>
              </li>
              <li className="flex gap-3">
                <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span>
                  food court da esquina serve café da manhã e almoço rápido até as 15h.
                </span>
              </li>
              <li className="flex gap-3">
                <Car className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <span>
                  Estacionamento rotativo na <strong className="text-ink-200">
                    Rua das Oliveiras
                  </strong>
                  , a 100 m. Próximo à loja há vagas na faixa amarela.
                </span>
              </li>
            </ul>
          </div>

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
