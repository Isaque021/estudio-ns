"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { AdminNav, MobileNavClose } from "@/components/admin/admin-nav";

export function AdminMobileNav({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu do painel"
        className="flex size-9 items-center justify-center rounded-lg border border-ink-800 text-ink-200 lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-ink-800 bg-ink-900 p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="display text-lg text-ink-50">Painel</span>
              <MobileNavClose onClose={() => setOpen(false)} />
            </div>
            <AdminNav role={role} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
