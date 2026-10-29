"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { contactLink } from "@/lib/whatsapp";

export function WhatsAppFab() {
  const pathname = usePathname();

  // No /agendar o balão é escondido: ele fica desenhado sobre o rodapé de
  // navegação do wizard em telas estreitas e absorve os toques no canto do
  // botão Continuar. Nessa tela os CTAs de WhatsApp já existem no conteúdo.
  if (pathname.startsWith("/admin") || pathname.startsWith("/agendar")) {
    return null;
  }

  return (
    <a
      href={contactLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-ink-950 shadow-[0_12px_32px_-8px_rgba(37,211,102,0.6)] transition-transform hover:scale-105"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
