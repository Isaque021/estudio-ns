import type { Metadata } from "next";

import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os produtos do seu pedido antes de finalizar pelo WhatsApp.",
};

export default function CartPage() {
  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Carrinho</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Seu pedido
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Confira os itens, informe seus dados e finalize pelo WhatsApp com pagamento
          presencial.
        </p>
      </div>

      <div className="mt-12">
        <CartView />
      </div>
    </div>
  );
}
