import { ExternalLink, LogOut, Scissors } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { signOut } from "@/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { getAdminSession } from "@/lib/auth";
import { siteConfig } from "@/lib/site-config";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const isLogin = pathname.startsWith("/admin/login");

  const session = await getAdminSession();

  if (!session && !isLogin) {
    redirect("/admin/login");
  }

  if (isLogin) {
    return <div className="min-h-screen bg-ink-950">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900/50 p-5 lg:flex">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Scissors className="size-4.5" />
            </span>
            <span className="leading-none">
              <span className="display block text-lg text-ink-50">Painel</span>
              <span className="text-[0.6rem] tracking-[0.24em] text-ink-500 uppercase">
                {siteConfig.name}
              </span>
            </span>
          </Link>

          <div className="mt-8 flex-1">
            <AdminNav role={session?.role} />
          </div>

          <div className="space-y-2 border-t border-ink-800 pt-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-400 transition-colors hover:bg-ink-800/60 hover:text-ink-50"
            >
              <ExternalLink className="size-3.5" />
              Ver o site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-400 transition-colors hover:bg-ink-800/60 hover:text-red-300"
              >
                <LogOut className="size-3.5" />
                Sair do painel
              </button>
            </form>
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-ink-800 bg-ink-950/90 px-5 backdrop-blur-xl lg:px-8">
            <AdminMobileNav role={session?.role} />
            <div className="lg:hidden">
              <span className="display text-base text-ink-50">Painel</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-xs text-ink-400 sm:block">
                {session?.name ?? session?.email}
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                {(session?.name ?? session?.email ?? "A").charAt(0).toUpperCase()}
              </span>
            </div>
          </header>

          <main className="flex-1 px-5 py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
