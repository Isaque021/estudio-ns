"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getBookingByCode, getServices, validatePendingConfirm } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gestão de uma reserva individual (tela /gerenciar/[code], aberta pelo
 * link da mensagem de WhatsApp). As validações de escopo, prazo e agenda
 * acontecem sempre no servidor — abrir a página não altera nada; só os
 * botões, com a ação revalidada aqui dentro.
 *
 * Exige ambiente configurado (Supabase): login REAL de profissional ou
 * administrador e banco persistente. No modo demonstração nada aqui
 * funciona — gerenciar reservas pela mão nunca é exposto em demo.
 */

export type BookingManageState = {
  status: "idle" | "success" | "error";
  message: string;
};

/** Sessão autorizada + dono do pedido. Erros voltam como mensagem de tela. */
async function scopedBooking(code: string): Promise<{
  error: string | null;
  booking: Awaited<ReturnType<typeof getBookingByCode>>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      error: "A gestão de reservas só funciona no ambiente configurado do estúdio (banco de dados e login ativos).",
      booking: null,
    };
  }

  const session = await getAdminSession();
  if (!session) return { error: "Não autorizado. Entre com sua conta do painel.", booking: null };

  // No painel existem papéis além de admin/profissional (staff genérico):
  // gestão de reserva exige um dos dois, no servidor.
  if (session.role !== "admin" && session.role !== "professional") {
    return { error: "Somente profissionais e administradores gerenciam reservas.", booking: null };
  }

  const booking = await getBookingByCode(code);
  if (!booking) {
    return { error: "Reserva não encontrada. Confira o código do link.", booking: null };
  }

  // Cada profissional só gerencia os PEDIDOS dele; admin gerencia todos.
  if (session.role === "professional" && session.professionalId !== booking.professionalId) {
    return { error: "Esta reserva pertence a outro profissional.", booking: null };
  }

  return { error: null, booking };
}

function ok(message: string): BookingManageState {
  return { status: "success", message };
}

function fail(message: string): BookingManageState {
  return { status: "error", message };
}

function revalidar(code: string): void {
  revalidatePath(`/gerenciar/${code}`);
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin");
}

export async function confirmBookingAction(
  _prev: BookingManageState,
  formData: FormData,
): Promise<BookingManageState> {
  const code = String(formData.get("code") ?? "");
  const loaded = await scopedBooking(code);
  if (loaded.error || !loaded.booking) return fail(loaded.error ?? "Reserva não encontrada.");
  const booking = loaded.booking;

  // Cliques repetidos/duplo toque: nada se duplica — o status já é a saída.
  if (booking.status === "confirmed") {
    return ok("Esta reserva já estava confirmada. Nada foi alterado.");
  }
  if (booking.status === "cancelled") {
    return fail("Este pedido foi recusado e não pode ser confirmado.");
  }
  if (booking.status !== "pending") {
    return fail("Este pedido não está mais aguardando confirmação.");
  }

  // Retenção expirada ou conflito de agenda: revalidação na hora, servindo
  // sempre da agenda atual (nunca de dado vindo da tela).
  const conflict = await validatePendingConfirm(booking, await getServices());
  if (conflict) return fail(conflict);

  const admin = createAdminClient();
  if (!admin) return fail("Não foi possível confirmar a reserva agora.");

  // A condição .eq("status","pending") torna a operação segura em corrida:
  // se outra pessoa processou primeiro, o update não afeta nenhuma linha.
  const { data, error } = await admin
    .from("bookings")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", booking.id)
    .eq("status", "pending")
    .select("id");

  if (error) return fail("Não foi possível confirmar a reserva agora.");
  if (!data || data.length === 0) {
    return fail("Outra pessoa já processou este pedido. Recarregue a página.");
  }

  revalidar(code);
  return ok("Reserva confirmada! Fale com o cliente pelo WhatsApp abaixo.");
}

export async function declineBookingAction(
  _prev: BookingManageState,
  formData: FormData,
): Promise<BookingManageState> {
  const code = String(formData.get("code") ?? "");
  const loaded = await scopedBooking(code);
  if (loaded.error || !loaded.booking) return fail(loaded.error ?? "Reserva não encontrada.");
  const booking = loaded.booking;

  // Cancelada é o cenário mais comum de toque duplo: resposta não muda nada.
  if (booking.status === "cancelled") {
    return ok("Este pedido já estava recusado. Nada foi alterado.");
  }
  // Recusar uma reserva já CONFIRMADA causaria alteração indevida — o painel
  // tem o fluxo de cancelamento com histórico adequado.
  if (booking.status === "confirmed" || booking.status === "completed") {
    return fail("Reserva confirmada não pode ser recusada nesta tela. Use o painel.");
  }
  if (booking.status !== "pending") {
    return fail("Este pedido não está mais aguardando confirmação.");
  }

  const admin = createAdminClient();
  if (!admin) return fail("Não foi possível recusar o pedido agora.");

  const { data, error } = await admin
    .from("bookings")
    .update({ status: "cancelled", confirmed_at: null })
    .eq("id", booking.id)
    .eq("status", "pending")
    .select("id");

  if (error) return fail("Não foi possível recusar o pedido agora.");
  if (!data || data.length === 0) {
    return fail("Outra pessoa já processou este pedido. Recarregue a página.");
  }

  revalidar(code);
  return ok("Pedido recusado e horário liberado.");
}