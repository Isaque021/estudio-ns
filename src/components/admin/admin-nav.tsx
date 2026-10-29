"use client";

import {
  BarChart3,
  Boxes,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Package,
  Scissors,
  ShoppingCart,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const adminNav = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: CalendarCheck },
  { href: "/admin/agendas", label: "Agendas", icon: CalendarDays },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/equipe", label: "Equipe", icon: UserCog },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
];

type AdminNavProps = {
  role?: string;
  onNavigate?: () => void;
};

export function AdminNav({ role, onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  const visibleItems = adminNav.filter((item) => {
    if (role === "admin") return true;

    return (
      role === "professional" &&
      (item.href === "/admin/agendamentos" ||
        item.href === "/admin/agendas" ||
        item.href === "/admin/clientes")
    );
  });
  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-brand-500/15 text-brand-300"
                : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-50",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fechar menu"
      className="flex size-9 items-center justify-center rounded-lg border border-ink-800 text-ink-300 lg:hidden"
    >
      <X className="size-4" />
    </button>
  );
}
