import type { Metadata } from "next";

import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description:
    "Informe seus dados e finalize o pedido da loja pelo WhatsApp com pagamento presencial.",
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Finalizar pedido
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Preencha seus dados, registre o pedido e conclua pelo WhatsApp. O pagamento é
          presencial, na retirada.
        </p>
      </div>

      <div className="mt-12">
        <CheckoutForm />
      </div>
    </div>
  );
}
