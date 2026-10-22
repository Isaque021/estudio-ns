import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, ShieldCheck, Tag, Truck } from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import {
  ProductDetailClient,
  ProductPrice,
} from "@/components/store/product-detail-client";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, 3);

  return (
    <div className="container-page py-16 lg:py-20">
      <nav className="flex items-center gap-1.5 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-300">
          Início
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/loja" className="hover:text-brand-300">
          Loja
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-ink-300">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">
              <Tag className="size-3" />
              {product.category}
            </span>
            <span className="badge">SKU {product.sku}</span>
          </div>

          <h1 className="display mt-4 text-3xl text-ink-50 sm:text-4xl">{product.name}</h1>

          <div className="mt-5">
            <ProductPrice product={product} />
          </div>

          <p className="mt-5 text-base leading-relaxed text-ink-300">{product.description}</p>

          <div className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
            <p className="text-sm text-ink-300">
              {product.stock > 0 ? (
                <>
                  <strong className="font-semibold text-brand-300">
                    {product.stock} unidades
                  </strong>{" "}
                  em estoque — retirada imediata na loja.
                </>
              ) : (
                "Sem estoque no momento. Fale com a gente para avisar quando voltar."
              )}
            </p>
            <div className="mt-4 grid gap-2 text-xs text-ink-400 sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <Package className="size-3.5 text-brand-500" /> Retirada na loja
              </span>
              <span className="flex items-center gap-2">
                <Truck className="size-3.5 text-brand-500" /> Envio pelos Correios
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-brand-500" /> Pagamento presencial
              </span>
            </div>
          </div>

          <ProductDetailClient product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="display text-2xl text-ink-50">Você também pode gostar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
