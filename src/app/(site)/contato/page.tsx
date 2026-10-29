import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/site/contact-form";
import { siteConfig } from "@/lib/site-config";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o Estúdio NS pelo WhatsApp ou telefone. Estamos na Rua Doutor Carlos Bastos Aranha, CEP 02278-010.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Contato</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Fale com a gente
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Dúvida sobre serviço, preço, produto ou quer confirmar um agendamento? O
          Fale com a equipe pelo WhatsApp durante o horário de funcionamento.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <a
            href={contactLink()}
            target="_blank"
            rel="noreferrer"
            className="card card-hover flex items-center gap-4 p-6"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15 text-[#25d366]">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">WhatsApp</p>
              <p className="text-xs text-ink-400">Resposta mais rápida</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-ink-500" />
          </a>

          <a href={`tel:${siteConfig.contact.phoneE164}`} className="card card-hover flex items-center gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">{siteConfig.contact.phone}</p>
              <p className="text-xs text-ink-400">Contato geral — Neto</p>
            </div>
          </a>

          <div className="card flex items-center gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-ink-200">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">
                {siteConfig.address.street}
              </p>
              <p className="text-xs text-ink-400">CEP {siteConfig.address.zip}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-ink-200">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">Terça a sábado, 9h — 19h</p>
              <p className="text-xs text-ink-400">Domingo e segunda: fechado</p>
            </div>
          </div>
        </div>

        <div>
          <ContactForm />

          <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-6">
            <h2 className="text-sm font-semibold text-ink-50">Prefere agendar direto?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              Para a barbearia, escolha serviço, profissional, data e horário.
              A solicitação fica aguardando a confirmação da equipe no painel.
            </p>
            <Link href="/agendar" className="btn btn-primary mt-5">
              Ir para o agendamento
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
