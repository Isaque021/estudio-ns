import {
  CalendarCheck,
  CircleDollarSign,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader, StatCard } from "@/components/admin/admin-page-header";
import { formatCreatedAt } from "@/lib/admin-ui";
import { getAdminSession } from "@/lib/auth";
import {
  demoMode,
  getAdminBookings,
  getAdminClients,
  getAdminOrders,
  getDashboardReport,
} from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/agendamentos");
  }

  const [report, bookings, orders, clients] = await Promise.all([
    getDashboardReport(),
    getAdminBookings(),
    getAdminOrders(),
    getAdminClients(),
  ]);


  const upcoming = bookings
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  const maxRevenue = Math.max(
    ...report.dailyRevenue.map((day) => day.revenueCents),
    1,
  );

  return (
    <div>
      <AdminPageHeader
        title="Visão geral"
        description="Resumo do dia, da agenda e do faturamento da barbearia."
        action={
          demoMode ? (
            <span className="badge border-brand-600/50 bg-brand-500/10 text-brand-300">
              Modo demonstração
            </span>
          ) : undefined
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento"
          value={formatCurrency(report.revenueCents)}
          hint="Serviços confirmados + pedidos"
          icon={CircleDollarSign}
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(report.averageTicketCents)}
          hint={`${report.bookingsTotal} agendamentos · ${report.ordersTotal} pedidos`}
          icon={TrendingUp}
        />
        <StatCard
          label="Aguardando confirmação"
          value={String(report.bookingsPending)}
          hint="Agendamentos aguardando resposta"
          icon={CalendarCheck}
        />
        <StatCard
          label="Clientes no mês"
          value={String(report.newClients)}
          hint={`${clients.length} clientes cadastrados`}
          icon={UserPlus}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink-50">Faturamento por dia</h2>
            <span className="text-xs text-ink-500">últimos 14 dias</span>
          </div>

          {report.dailyRevenue.length === 0 ? (
            <p className="mt-6 text-sm text-ink-500">Sem dados no período.</p>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1.5">
              {report.dailyRevenue.map((day) => (
                <div key={day.date} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-brand-600/50 transition-colors group-hover:bg-brand-500"
                      style={{
                        height: `${Math.max((day.revenueCents / maxRevenue) * 100, 3)}%`,
                      }}
                      title={`${formatCurrency(day.revenueCents)} em ${day.date}`}
                    />
                  </div>
                  <span className="text-[0.6rem] text-ink-600">
                    {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-ink-50">Serviços mais vendidos</h2>
          {report.topServices.length === 0 ? (
            <p className="mt-6 text-sm text-ink-500">Sem dados no período.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {report.topServices.map((service, index) => (
                <li key={service.name} className="flex items-center gap-3">
                  <span className="font-display w-6 text-lg text-ink-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-200">{service.name}</p>
                    <p className="text-xs text-ink-500">{service.total} agendamentos</p>
                  </div>
                  <span className="font-display text-base text-brand-400">
                    {formatCurrency(service.revenueCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink-50">Próximos agendamentos</h2>
            <Link href="/admin/agendamentos" className="text-xs text-brand-400 hover:underline">
              Ver todos
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-ink-500">Nenhum agendamento futuro.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {upcoming.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 border-b border-ink-800/70 pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-100">{booking.clientName}</p>
                    <p className="text-xs text-ink-500">
                      {booking.date.split("-").reverse().join("/")} às {booking.time} ·{" "}
                      {booking.serviceName}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase ${booking.status === "confirmed"
                        ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
                        : "border-brand-600/50 bg-brand-500/10 text-brand-300"
                      }`}
                  >
                    {booking.status === "confirmed" ? "Confirmado" : "Aguardando"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink-50">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-xs text-brand-400 hover:underline">
              Ver todos
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="mt-6 text-sm text-ink-500">Nenhum pedido registrado.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.slice(0, 5).map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-4 border-b border-ink-800/70 pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-100">{order.clientName}</p>
                    <p className="text-xs text-ink-500">
                      {order.code} · {formatCreatedAt(order.createdAt)}
                    </p>
                  </div>
                  <span className="font-display text-base text-brand-400">
                    {formatCurrency(order.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/agendamentos"
          className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5 transition-colors hover:border-brand-600/50"
        >
          <CalendarCheck className="size-5 text-brand-400" />
          <p className="mt-3 text-sm font-semibold text-ink-50">Confirmar reservas</p>
          <p className="mt-1 text-xs text-ink-400">
            {report.bookingsPending} reservas aguardando confirmação.
          </p>
        </Link>
        <Link
          href="/admin/pedidos"
          className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5 transition-colors hover:border-brand-600/50"
        >
          <ShoppingCart className="size-5 text-brand-400" />
          <p className="mt-3 text-sm font-semibold text-ink-50">Pedidos da loja</p>
          <p className="mt-1 text-xs text-ink-400">
            {report.ordersTotal} pedidos registrados.
          </p>
        </Link>
        <Link
          href="/admin/clientes"
          className="rounded-2xl border border-ink-800 bg-ink-900/40 p-5 transition-colors hover:border-brand-600/50"
        >
          <Users className="size-5 text-brand-400" />
          <p className="mt-3 text-sm font-semibold text-ink-50">Base de clientes</p>
          <p className="mt-1 text-xs text-ink-400">
            {clients.length} clientes cadastrados.
          </p>
        </Link>
      </div>
    </div>
  );
}
