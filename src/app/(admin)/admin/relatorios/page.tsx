import { redirect } from "next/navigation";

import { AdminPageHeader, StatCard } from "@/components/admin/admin-page-header";
import { getAdminSession } from "@/lib/auth";
import { getDashboardReport } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AdminReportsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/agendamentos");
  }

  const report = await getDashboardReport();

  const maxDaily = Math.max(...report.dailyRevenue.map((day) => day.revenueCents), 1);
  const maxService = Math.max(...report.topServices.map((s) => s.revenueCents), 1);
  const maxProduct = Math.max(...report.topProducts.map((p) => p.revenueCents), 1);

  return (
    <div>
      <AdminPageHeader
        title="Relatórios"
        description="Indicadores consolidados da barbearia: faturamento, ticket médio, serviços e produtos."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento total"
          value={formatCurrency(report.revenueCents)}
          hint="Serviços + produtos"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(report.averageTicketCents)}
          hint="Por atendimento ou pedido"
        />
        <StatCard
          label="Agendamentos"
          value={String(report.bookingsTotal)}
          hint={`${report.bookingsConfirmed} confirmados · ${report.bookingsPending} pendentes`}
        />
        <StatCard
          label="Pedidos da loja"
          value={String(report.ordersTotal)}
          hint={formatCurrency(report.ordersRevenueCents)}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
        <h2 className="text-sm font-semibold text-ink-50">Faturamento diário</h2>
        {report.dailyRevenue.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">Sem dados no período.</p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {report.dailyRevenue
              .slice()
              .reverse()
              .map((day) => (
                <li key={day.date} className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-xs text-ink-500">
                    {day.date.split("-").reverse().join("/")}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                    <span
                      className="block h-full rounded-full bg-brand-500/70"
                      style={{ width: `${(day.revenueCents / maxDaily) * 100}%` }}
                    />
                  </span>
                  <span className="w-28 shrink-0 text-right font-display text-sm text-ink-100">
                    {formatCurrency(day.revenueCents)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-ink-50">Serviços mais vendidos</h2>
          {report.topServices.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Sem dados no período.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {report.topServices.map((service) => (
                <li key={service.name} className="flex items-center gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-200">
                      {service.name}
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <span
                        className="block h-full rounded-full bg-brand-500/70"
                        style={{ width: `${(service.revenueCents / maxService) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-sm text-brand-400">
                      {formatCurrency(service.revenueCents)}
                    </span>
                    <span className="block text-[0.65rem] text-ink-500">
                      {service.total}×
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-ink-50">Produtos mais vendidos</h2>
          {report.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Sem dados no período.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {report.topProducts.map((product) => (
                <li key={product.name} className="flex items-center gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-200">
                      {product.name}
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <span
                        className="block h-full rounded-full bg-sky-500/70"
                        style={{ width: `${(product.revenueCents / maxProduct) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-sm text-brand-400">
                      {formatCurrency(product.revenueCents)}
                    </span>
                    <span className="block text-[0.65rem] text-ink-500">
                      {product.total}×
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
