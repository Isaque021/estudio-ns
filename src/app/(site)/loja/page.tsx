import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Package, ShieldCheck } from "lucide-react";

import { Storefront } from "@/components/store/storefront";
import { getProducts } from "@/lib/data";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Loja da barbearia: pomadas, géis, bálsamos, shampoos e equipamentos. Retire na loja, pagamento presencial.",
};

export default async function StorePage() {
  const products = await getProducts();

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Loja</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Produtos da casa
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Confira os produtos disponíveis, monte seu carrinho e envie o
          pedido pelo WhatsApp. O pagamento é presencial, na retirada.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Package,
            title: "Retirada na loja",
            text: "Combine a retirada com a equipe pelo WhatsApp.",
          },
          {
            icon: ShieldCheck,
            title: "Pagamento presencial",
            text: "Pague no estúdio ao retirar seu pedido.",
          },
          {
            icon: MessageCircle,
            title: "Pedido pelo WhatsApp",
            text: "Converse com a equipe para acompanhar seu pedido.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <item.icon className="size-5 text-brand-400" />
            <h2 className="mt-3 text-sm font-semibold text-ink-50">{item.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Storefront products={products} />
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 text-center sm:p-10">
        <h2 className="display text-3xl text-ink-50">Precisa de ajuda para escolher?</h2>
        <p className="max-w-lg text-sm leading-relaxed text-ink-400">
          Manda uma mensagem que a gente indica o produto ideal para o seu tipo de cabelo
          ou barba.
        </p>
        <a
          href={contactLink("Olá! Preciso de ajuda para escolher um produto.")}
          target="_blank"
          rel="noreferrer"
          className="btn btn-whatsapp"
        >
          <MessageCircle className="size-4" />
          Falar com a equipe
        </a>
        <Link href="/carrinho" className="text-xs text-ink-500 underline-offset-4 hover:underline">
          Ver meu carrinho
        </Link>
      </div>
    </div>
  );
}
