import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

/** Casca visual das páginas públicas (cabeçalho, conteúdo, rodapé). */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
