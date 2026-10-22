"use client";

import { Check, MessageCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { QuantityControl } from "@/components/site/product-card";
import { useCart } from "@/components/store/cart-context";
import { productInquiryMessage } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityControl
          value={quantity}
          max={Math.max(product.stock, 1)}
          onChange={(next) => setQuantity(next)}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`btn flex-1 sm:flex-none ${added ? "btn-ghost" : "btn-primary"}`}
        >
          {added ? (
            <>
              <Check className="size-4" /> Adicionado ao carrinho
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              {outOfStock ? "Indisponível" : "Adicionar ao carrinho"}
            </>
          )}
        </button>
      </div>

      <a
        href={buildWhatsAppLink(
          productInquiryMessage({ name: product.name, priceCents: product.priceCents }),
        )}
        target="_blank"
        rel="noreferrer"
        className="btn btn-whatsapp w-full"
      >
        <MessageCircle className="size-4" />
        Tirar dúvida sobre este produto
      </a>

      {outOfStock && (
        <p className="text-center text-xs text-red-300">
          Produto temporariamente sem estoque. Fale com a gente pelo WhatsApp para
          avisar quando voltar.
        </p>
      )}
    </div>
  );
}

export function ProductPrice({ product }: { product: Product }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display text-4xl text-brand-400">
        {formatCurrency(product.priceCents)}
      </span>
      {product.compareAtCents && product.compareAtCents > product.priceCents && (
        <span className="text-lg text-ink-500 line-through">
          {formatCurrency(product.compareAtCents)}
        </span>
      )}
    </div>
  );
}
