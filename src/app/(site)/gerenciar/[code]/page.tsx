import { CheckCircle2, Clock, Info, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ManageBookingForm } from "@/components/booking/manage-booking-form";
import { getAdminSession } from "@/lib/auth";
import { getBookingByCode, getBookingSettings } from "@/lib/data";
import {
  formatHoldDeadline,
  isPendingValid,
  pendingValidUntil,
} from "@/lib/schedule";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { BookingStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  bookingConfirmedMessage,
  buildWhatsAppLink,
  ensureDdi,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gerenciar reserva · Estúdio NS",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmada",
  completed: "Concluído",
  cancelled: "Recusada",
  no_show: "Não compareceu",
};

function StatusPill({ status }: { status: BookingStatus }) {
  const tone =
    status === "confirmed" || status === "completed"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : status === "pending"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-red-500/40 bg-red-500/10 text-red-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function Linha({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-800/70 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink-500">{titulo}</span>
      <span className="text-right text-sm text-ink-100">{valor}</span>
    </div>
  );
}

export default async function GerenciarReservaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Lock className="mx-auto size-10 text-ink-600" />
        <h1 className="display mt-4 text-2xl text-ink-50">
          Gestão indisponível
        </h1>
        <p className="mt-3 text-sm text-ink-400">
          A gestão de reservas funciona no ambiente configurado do estúdio, com
          banco de dados e login ativos. Entre em contato com a equipe.
        </p>
      </div>
    );
  }

  const session = await getAdminSession();

  if (!session) {
    redirect(
      `/admin/login?redirect=${encodeURIComponent(`/gerenciar/${code}`)}`,
    );
  }

  const booking = await getBookingByCode(code);

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Lock className="mx-auto size-10 text-ink-600" />
        <h1 className="display mt-4 text-2xl text-ink-50">
          Reserva não encontrada
        </h1>
        <p className="mt-3 text-sm text-ink-400">
          O código <span className="font-mono">{code}</span> não corresponde a
          nenhuma reserva do estúdio. Confira o link recebido pelo WhatsApp.
        </p>
        <Link href="/" className="btn btn-ghost mt-8">
          Voltar ao site
        </Link>
      </div>
    );
  }

  // As ações do servidor também validam o acesso à reserva.
  const foraDoEscopo =
    session.role === "professional" &&
    session.professionalId !== booking.professionalId;

  const semPapel =
    session.role !== "admin" && session.role !== "professional";

  if (foraDoEscopo || semPapel) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Lock className="mx-auto size-10 text-ink-600" />
        <h1 className="display mt-4 text-2xl text-ink-50">
          Acesso restrito
        </h1>
        <p className="mt-3 text-sm text-ink-400">
          {foraDoEscopo
            ? "Esta reserva pertence a outro profissional."
            : "Somente profissionais e administradores gerenciam reservas."}
        </p>
        <Link href="/admin/login" className="btn btn-ghost mt-8">
          Entrar com outra conta
        </Link>
      </div>
    );
  }

  const settings = await getBookingSettings();
  const data = booking.date.split("-").reverse().join("/");
  const prazo = formatHoldDeadline(
    pendingValidUntil(booking.createdAt, settings.holdMinutes),
  );
  const expirada =
    booking.status === "pending" &&
    !isPendingValid(booking, settings.holdMinutes);

  return (
    <div className="mx-auto max-w-lg px-5 pb-24 pt-10 sm:pt-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-500">
        Gestão de reserva
      </p>
      <h1 className="display mt-2 text-3xl text-ink-50">
        {booking.code}
      </h1>

      <div className="card mt-6 px-5 py-6 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="display text-lg text-ink-50">
            Resumo do pedido
          </h2>
          <StatusPill status={booking.status} />
        </div>

        <div className="mt-4">
          <Linha titulo="Cliente" valor={booking.clientName} />
          <Linha titulo="Serviço" valor={booking.serviceName} />
          <Linha titulo="Profissional" valor={booking.professionalName} />
          <Linha titulo="Data" valor={data} />
          <Linha titulo="Horário" valor={booking.time} />
          <Linha titulo="Valor" valor={formatCurrency(booking.priceCents)} />
          {booking.notes && (
            <Linha titulo="Observações" valor={booking.notes} />
          )}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <Info className="mt-0.5 size-4 shrink-0" />
          Abrir este link não confirma nem altera a reserva. A ação vale só ao
          tocar nos botões.
        </p>

        {booking.status === "pending" && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-200/90">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <span>
              {expirada ? (
                <>
                  A retenção de 30 minutos venceu ({prazo}). Ao confirmar, o
                  servidor verifica a vaga: se o horário já foi ocupado por
                  outro atendimento, a confirmação é bloqueada.
                </>
              ) : (
                <>O horário fica retido até {prazo}.</>
              )}
            </span>
          </p>
        )}

        {booking.status === "pending" && (
          <ManageBookingForm code={booking.code} />
        )}

        {booking.status === "confirmed" && (
          <div className="mt-6">
            <a
              href={buildWhatsAppLink(
                bookingConfirmedMessage(booking),
                ensureDdi(booking.clientPhone),
              )}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 py-4 text-base font-semibold text-ink-950 transition hover:brightness-110 sm:py-5"
            >
              <CheckCircle2 className="size-5" />
              Enviar confirmação pelo WhatsApp
            </a>
            <p className="mt-2 text-center text-xs text-ink-500">
              Abre o chat no WhatsApp do cliente, no número informado por ele,
              com a mensagem pronta de confirmação — nada é enviado
              automaticamente.
            </p>
          </div>
        )}

        {(booking.status === "cancelled" ||
          booking.status === "no_show") && (
            <p className="mt-6 rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3 text-sm text-ink-400">
              Este pedido está recusado — o horário já foi liberado na agenda.
            </p>
          )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-600">
        <Link
          href="/admin/agendamentos"
          className="underline decoration-dotted hover:text-ink-400"
        >
          Abrir o painel de agendamentos
        </Link>
      </p>
    </div>
  );
}