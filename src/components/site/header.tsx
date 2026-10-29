"use client";

import { Menu, Scissors, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/components/store/cart-context";
import { siteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/servicos", label: "Serviços" },
  { href: "/profissionais", label: "Profissionais" },
  { href: "/localizacao", label: "Localização" },
  { href: "/admin/login", label: "Área da equipe" },
];

const bookingButton =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#e4b38e]/40 bg-gradient-to-b from-[#dfad85] to-[#ba7952] px-5 py-2.5 text-sm font-semibold text-[#181310] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#754b34,0_8px_18px_rgba(0,0,0,0.25)] transition-[transform,box-shadow,filter] hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_0_#754b34] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85] motion-reduce:transition-none motion-reduce:active:translate-y-0";

export function SiteHeader() {
  const pathname = usePathname();
  const { totalItems, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onResize(event: MediaQueryListEvent) {
      if (event.matches) {
        setOpen(false);
      }
    }

    const desktop = window.matchMedia("(min-width: 1024px)");

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const cartLabel = hydrated
    ? `Carrinho com ${totalItems} itens`
    : "Carrinho";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#17181b]/95 text-[#f7f4ef] backdrop-blur-xl">
      <div className="container-page flex h-[76px] items-center justify-between gap-3">
        <Link
          href="/"
          onClick={closeMenu}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dfad85]/30 bg-gradient-to-br from-[#37312d] to-[#1d1c1c] text-[#dfad85] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.25)]">
            <Scissors aria-hidden="true" className="size-5" />
          </span>

          <span className="display truncate text-lg tracking-wide text-[#f7f4ef] sm:text-xl">
            {siteConfig.name}
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-2 lg:flex"
        >
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dfad85] ${active
                  ? "bg-white/5 font-medium text-[#dfad85]"
                  : "text-[#d0cdc8] hover:bg-white/5 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/carrinho"
            onClick={closeMenu}
            aria-label={cartLabel}
            className="relative flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-[#e8e3dd] transition-colors hover:border-[#dfad85]/60 hover:text-[#dfad85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85]"
          >
            <ShoppingBag aria-hidden="true" className="size-5" />

            {hydrated && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#dfad85] px-1 py-0.5 text-[0.65rem] font-bold text-[#181310]">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/agendar"
            onClick={closeMenu}
            className={`${bookingButton} hidden sm:inline-flex`}
          >
            Agendar
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="flex size-11 items-center justify-center rounded-full border border-white/15 text-[#f7f4ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfad85] lg:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-mobile-nav"
          className="max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-white/10 bg-[#1d1e22] lg:hidden"
        >
          <nav
            aria-label="Navegação no celular"
            className="container-page flex flex-col py-5"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-lg border-b border-white/10 px-2 py-3.5 text-base focus-visible:outline-2 focus-visible:outline-[#dfad85] ${isActive(item.href)
                  ? "font-medium text-[#dfad85]"
                  : "text-[#e8e3dd] hover:text-[#dfad85]"
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/carrinho"
              onClick={closeMenu}
              className="rounded-lg border-b border-white/10 px-2 py-3.5 text-base text-[#e8e3dd] focus-visible:outline-2 focus-visible:outline-[#dfad85]"
            >
              Carrinho
              {hydrated && totalItems > 0 ? ` (${totalItems})` : ""}
            </Link>

            <div className="pb-2 pt-6">
              <Link
                href="/agendar"
                onClick={closeMenu}
                className={`${bookingButton} w-full`}
              >
                Agendar horário
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}