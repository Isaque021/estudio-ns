import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/site/contact-form";
import { siteConfig } from "@/lib/site-config";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Barbearia Navalha pelo WhatsApp, telefone ou e-mail. Estamos na Rua das Laranjeiras, 240 — Centro.",
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
          WhatsApp é o canal mais rápido — respondemos em poucos minutos dentro do
          horário de funcionamento.
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
              <p className="text-xs text-ink-400">Ligação para a recepção</p>
            </div>
          </a>

          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="card card-hover flex items-center gap-4 p-6"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-ink-200">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">{siteConfig.contact.email}</p>
              <p className="text-xs text-ink-400">E-mail e faturamento</p>
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
              <p className="text-xs text-ink-400">
                {siteConfig.address.district} — {siteConfig.address.city}/
                {siteConfig.address.state}
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-ink-200">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-50">Seg a Sex 9h — 21h</p>
              <p className="text-xs text-ink-400">Sábado 9h — 19h · Domingo 10h — 17h</p>
            </div>
          </div>
        </div>

        <div>
          <ContactForm />

          <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-6">
            <h2 className="text-sm font-semibold text-ink-50">Prefere agendar direto?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              Escolha serviço, profissional, data e horário e receba a confirmação pelo
              WhatsApp.
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
