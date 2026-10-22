"use client";

import { Menu, Phone, Scissors, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation, siteConfig } from "@/lib/site-config";
import { useCart } from "@/components/store/cart-context";

export function SiteHeader() {
  const pathname = usePathname();
  const { totalItems, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-400 transition-colors group-hover:bg-brand-500/25">
            <Scissors className="size-4.5" />
          </span>
          <span className="leading-none">
            <span className="display block text-lg text-ink-50">{siteConfig.name}</span>
            <span className="hidden text-[0.6rem] tracking-[0.28em] text-ink-400 uppercase sm:block">
              Barbearia clássica
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-brand-300"
                    : "text-ink-300 hover:text-ink-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrinho"
            aria-label={`Carrinho com ${totalItems} itens`}
            className="relative flex size-10 items-center justify-center rounded-full border border-ink-800 text-ink-200 transition-colors hover:border-brand-500/60 hover:text-brand-300"
          >
            <ShoppingBag className="size-4.5" />
            {hydrated && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand-500 text-[0.65rem] font-bold text-ink-950">
                {totalItems}
              </span>
            )}
          </Link>

          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            className="hidden items-center gap-2 rounded-full border border-ink-800 px-4 py-2 text-sm text-ink-200 transition-colors hover:border-brand-500/60 hover:text-brand-300 md:inline-flex"
          >
            <Phone className="size-4" />
            {siteConfig.contact.phone}
          </a>

          <Link href="/agendar" className="btn btn-primary hidden sm:inline-flex">
            Agendar
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-full border border-ink-800 text-ink-200 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-800 bg-ink-950/98 lg:hidden">
          <nav className="container-page flex flex-col py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-ink-900 py-3 text-base text-ink-200 last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/agendar" onClick={closeMenu} className="btn btn-primary w-full">
                Agendar horário
              </Link>
              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                onClick={closeMenu}
                className="btn btn-ghost w-full"
              >
                {siteConfig.contact.phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
