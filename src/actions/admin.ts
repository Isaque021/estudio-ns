"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { calendarDate, productInput, professionalInput, quantity as stockQuantity, serviceInput } from "@/lib/validation";

import { getAdminSession } from "@/lib/auth";
import { getServices, validatePendingConfirm } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_STATUSES, ORDER_STATUSES, SCHEDULE_EXCEPTION_KINDS } from "@/lib/types";
import type {
  BookingStatus,
  OrderStatus,
  ScheduleExceptionKind,
  StockMovement,
} from "@/lib/types";
import { nowInStudioTZ, parseHM } from "@/lib/schedule";

export type ActionResult = {
  ok: boolean;
  message: string;
};

async function authorized(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "admin";
}


/** Profissional com escopo restrito só edita a própria agenda. */
function canChangeBooking(current: BookingStatus, next: BookingStatus): boolean {
  if (current === next) return true;
  return (current === "pending" && (next === "confirmed" || next === "cancelled")) ||
    (current === "confirmed" && ["completed", "cancelled", "no_show"].includes(next));
}

async function assertAgendaScope(professionalId: string): Promise<string | null> {
  const session = await getAdminSession();
  if (!session) return "Não autorizado.";
  if (session.role === "admin") return null;
  if (session.role === "professional" && session.professionalId === professionalId) return null;
  return "Este profissional não tem acesso à agenda solicitada.";
}

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<ActionResult> {
  const session = await getAdminSession();

  if (!session || !["admin", "professional"].includes(session.role)) {
    return { ok: false, message: "Não autorizado." };
  }

  if (!BOOKING_STATUSES.includes(status)) {
    return { ok: false, message: "Status inválido." };
  }

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { data: row } = await admin
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!row) {
      return { ok: false, message: "Agendamento não encontrado." };
    }

    const scopeError = await assertAgendaScope(
      String(row.professional_id),
    );

    if (scopeError) {
      return { ok: false, message: scopeError };
    }

    if (!canChangeBooking(row.status as BookingStatus, status)) {
      return { ok: false, message: "Esta alteração não é permitida para a situação atual da reserva." };
    }
    if (row.status === status) return { ok: true, message: "A reserva já está nesta situação." };

    // Pendente expirado só pode ser confirmado se o horário continua livre:
    // a revalidação é sempre no servidor, nunca confia no painel.
    if (status === "confirmed" && (row as { status?: string }).status === "pending") {
      const services = await getServices();
      const conflict = await validatePendingConfirm(
        {
          id: String(row.id ?? row.code),
          code: String(row.code),
          clientName: String(row.client_name),
          clientPhone: String(row.client_phone),
          clientEmail: row.client_email ? String(row.client_email) : null,
          serviceId: String(row.service_id ?? ""),
          serviceName: String(row.service_name ?? ""),
          professionalId: String(row.professional_id ?? ""),
          professionalName: String(row.professional_name ?? ""),
          date: String(row.scheduled_date),
          time: String(row.scheduled_time).slice(0, 5),
          status: "pending",
          notes: row.notes ? String(row.notes) : null,
          priceCents: Number(row.price_cents ?? 0),
          createdAt: String(row.created_at),
          durationMin:
            (row as { duration_minutes?: unknown }).duration_minutes == null
              ? undefined
              : Number((row as { duration_minutes?: unknown }).duration_minutes),
        },
        services,
      );
      if (conflict) return { ok: false, message: conflict };
    }

    const { data: changed, error } = await admin
      .from("bookings")
      .update({
        status,
        ...(status === "confirmed" ? { confirmed_at: new Date().toISOString() } : {}),
      })
      .eq("id", id)
      .eq("professional_id", row.professional_id)
      .eq("status", row.status)
      .select("id");

    if (error) return { ok: false, message: "Não foi possível atualizar o agendamento." };
    if (!changed?.length) return { ok: false, message: "A reserva mudou. Recarregue a página." };
  } else {
    const booking = demoStore.bookings.find((b) => b.id === id);

    if (!booking) {
      return { ok: false, message: "Agendamento não encontrado." };
    }

    // Profissional só altera reservas do próprio escopo (admin: todas).
    const scopeError = await assertAgendaScope(booking.professionalId);

    if (scopeError) {
      return { ok: false, message: scopeError };
    }

    if (!canChangeBooking(booking.status, status)) {
      return { ok: false, message: "Alteração de situação inválida." };
    }
    if (booking.status === "pending" && status === "confirmed") {
      const conflict = await validatePendingConfirm(booking, await getServices());
      if (conflict) return { ok: false, message: conflict };
    }
    booking.status = status;
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/relatorios");
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin");
  return { ok: true, message: "Agendamento atualizado." };
}

/* -------------------------------------------------------------------------- */
/*  Agenda: exceções, expediente e prazo de solicitação                        */
/* -------------------------------------------------------------------------- */

export async function saveScheduleException(formData: FormData): Promise<ActionResult> {
  const professionalId = String(formData.get("professionalId") ?? "");
  const date = String(formData.get("date") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const startAt = String(formData.get("startAt") ?? "");
  const endAt = String(formData.get("endAt") ?? "");
  const note = String(formData.get("note") ?? "");

  const scopeError = await assertAgendaScope(professionalId);
  if (scopeError) return { ok: false, message: scopeError };

  if (!calendarDate.safeParse(date).success || note.length > 500) return { ok: false, message: "Data inválida." };
  if (!SCHEDULE_EXCEPTION_KINDS.includes(kind as never)) {
    return { ok: false, message: "Tipo de ajuste inválido." };
  }
  if (nowInStudioTZ().date >= date) {
    return { ok: false, message: "Ajustes de agenda só valem a partir de amanhã." };
  }

  const needsTimes = kind !== "day-off";
  const startTime = parseHM(startAt);
  const endTime = parseHM(endAt);
  if (needsTimes && (startTime == null || endTime == null)) {
    return { ok: false, message: "Informe horário de início e fim." };
  }
  if (needsTimes && startTime != null && endTime != null && endTime <= startTime) {
    return { ok: false, message: "O fim precisa ser depois do início." };
  }

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin.from("professional_exceptions").insert({
      professional_id: professionalId,
      scheduled_date: date,
      kind,
      start_time: needsTimes ? startAt : null,
      end_time: needsTimes ? endAt : null,
      note: note || null,
    });
    if (error) return { ok: false, message: "Não foi possível salvar o ajuste." };
  } else {
    demoStore.scheduleExceptions = [
      {
        id: `exc-${Date.now()}`,
        professionalId,
        date,
        kind: kind as ScheduleExceptionKind,
        startAt: needsTimes ? startAt : null,
        endAt: needsTimes ? endAt : null,
        note: note || null,
        createdAt: new Date().toISOString(),
      },
      ...demoStore.scheduleExceptions,
    ];
  }

  revalidatePath("/admin/agendas");
  revalidatePath("/admin");
  return { ok: true, message: "Ajuste de agenda salvo." };
}

export async function deleteScheduleException(id: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, message: "Não autorizado." };
  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { data: row } = await admin
      .from("professional_exceptions")
      .select("professional_id")
      .eq("id", id)
      .maybeSingle();
    if (!row) return { ok: false, message: "Ajuste não encontrado." };
    const scopeError = await assertAgendaScope(String(row.professional_id));
    if (scopeError) return { ok: false, message: scopeError };

    const { error } = await admin.from("professional_exceptions").delete().eq("id", id);
    if (error) return { ok: false, message: "Não foi possível remover o ajuste." };
  } else {
    const exception = demoStore.scheduleExceptions.find((e) => e.id === id);
    if (!exception) return { ok: false, message: "Ajuste não encontrado." };
    const scopeError = await assertAgendaScope(exception.professionalId);
    if (scopeError) return { ok: false, message: scopeError };
    demoStore.scheduleExceptions = demoStore.scheduleExceptions.filter((e) => e.id !== id);
  }

  revalidatePath("/admin/agendas");
  return { ok: true, message: "Ajuste removido." };
}

/** Prazo de guarda das solicitações pendentes (min). */
export async function updateHoldMinutes(minutes: number): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) {
    return { ok: false, message: "Informe um prazo entre 1 e 1440 minutos." };
  }

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { data: existing } = await admin
      .from("booking_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    const { error } = existing?.id
      ? await admin.from("booking_settings").update({ hold_minutes: minutes }).eq("id", existing.id)
      : await admin.from("booking_settings").insert({ hold_minutes: minutes });

    if (error) return { ok: false, message: "Não foi possível salvar o prazo." };
  } else {
    demoStore.settings = { holdMinutes: minutes };
  }

  revalidatePath("/admin/agendas");
  revalidatePath("/admin/agendamentos");
  return { ok: true, message: "Prazo atualizado." };
}

/* Formas para <form>/<useActionState>. */

export async function saveScheduleExceptionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return saveScheduleException(formData);
}

export async function updateHoldMinutesAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const minutes = Number(formData.get("holdMinutes"));
  return updateHoldMinutes(minutes);
}

export async function deleteScheduleExceptionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return deleteScheduleException(String(formData.get("id") ?? ""));
}

/* -------------------------------------------------------------------------- */
/*  Pedidos                                                                    */
/* -------------------------------------------------------------------------- */

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };
  if (!ORDER_STATUSES.includes(status)) return { ok: false, message: "Status inválido." };

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin.rpc("ns_set_order_status", { p_id: id, p_status: status });
    if (error) return { ok: false, message: "Não foi possível atualizar. Confira a situação do pedido e o estoque disponível." };
  } else {
    const order = demoStore.orders.find((o) => o.id === id);
    if (!order) return { ok: false, message: "Pedido não encontrado." };

    if (order.status === "pending" && status !== "cancelled") {
      for (const item of order.items) {
        const product = demoStore.products.find((p) => p.id === item.productId);
        if (!product) continue;
        product.stock = Math.max(product.stock - item.quantity, 0);
        demoStore.stockMovements = [
          {
            id: `mv-${Date.now()}-${item.productId}`,
            productId: product.id,
            productName: product.name,
            type: "out",
            quantity: item.quantity,
            note: `Baixa automática — pedido ${order.code}`,
            createdAt: new Date().toISOString(),
          },
          ...demoStore.stockMovements,
        ];
      }
    }

    order.status = status;
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  return { ok: true, message: "Pedido atualizado." };
}

/* -------------------------------------------------------------------------- */
/*  Produtos e estoque                                                         */
/* -------------------------------------------------------------------------- */

export async function updateProduct(
  id: string,
  payload: {
    name: string;
    description: string;
    priceCents: number;
    compareAtCents: number | null;
    sku: string;
    category: string;
    active: boolean;
  },
): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const parsed = productInput.safeParse(payload);
  if (!parsed.success) return { ok: false, message: "Confira os campos informados." };
  payload = parsed.data;

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin
      .from("products")
      .update({
        name: payload.name,
        description: payload.description,
        price_cents: payload.priceCents,
        compare_at_cents: payload.compareAtCents,
        sku: payload.sku,
        category: payload.category,
        active: payload.active,
      })
      .eq("id", id);

    if (error) return { ok: false, message: "Não foi possível salvar o produto." };
  } else {
    const product = demoStore.products.find((p) => p.id === id);
    if (!product) return { ok: false, message: "Produto não encontrado." };
    Object.assign(product, payload);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  return { ok: true, message: "Produto atualizado." };
}

export async function createProduct(payload: {
  name: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  sku: string;
  category: string;
}): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const parsed = productInput.omit({ active: true }).extend({ stock: stockQuantity }).safeParse(payload);
  if (!parsed.success) return { ok: false, message: "Confira os campos informados." };
  payload = parsed.data;

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin.from("products").insert({
      name: payload.name,
      slug: payload.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: payload.description,
      price_cents: payload.priceCents,
      compare_at_cents: payload.compareAtCents,
      stock: payload.stock,
      sku: payload.sku,
      category: payload.category,
      active: true,
      image_url: "/images/product-01.svg",
    });

    if (error) return { ok: false, message: "Não foi possível criar o produto." };
  } else {
    demoStore.products = [
      {
        id: `prd-${Date.now()}`,
        name: payload.name,
        slug: payload.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        description: payload.description,
        priceCents: payload.priceCents,
        compareAtCents: payload.compareAtCents,
        stock: payload.stock,
        sku: payload.sku,
        category: payload.category,
        imageUrl: "/images/product-01.svg",
        active: true,
      },
      ...demoStore.products,
    ];
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  return { ok: true, message: "Produto criado." };
}

export async function adjustStock(
  productId: string,
  type: StockMovement["type"],
  quantity: number,
  note: string,
): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };
  if (!["in", "out", "adjust"].includes(type) || !Number.isInteger(quantity) || quantity === 0 || Math.abs(quantity) > 1_000_000 || typeof note !== "string" || note.length > 500) {
    return { ok: false, message: "Informe uma quantidade válida." };
  }

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin.rpc("ns_adjust_stock", {
      p_id: productId, p_type: type, p_quantity: quantity, p_note: note,
    });
    if (error) return { ok: false, message: "Não foi possível ajustar. Confira a quantidade e o estoque disponível." };
  } else {
    const product = demoStore.products.find((p) => p.id === productId);
    if (!product) return { ok: false, message: "Produto não encontrado." };

    const delta = type === "in" ? Math.abs(quantity) : type === "out" ? -Math.abs(quantity) : quantity;
    product.stock = Math.max(product.stock + delta, 0);

    demoStore.stockMovements = [
      {
        id: `mv-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        type,
        quantity: Math.abs(quantity),
        note: note || null,
        createdAt: new Date().toISOString(),
      },
      ...demoStore.stockMovements,
    ];
  }

  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/loja");
  return { ok: true, message: "Estoque atualizado." };
}

/* -------------------------------------------------------------------------- */
/*  Serviços e equipe                                                          */
/* -------------------------------------------------------------------------- */

export async function toggleService(id: string): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { data: service } = await admin.from("services").select("active").eq("id", id).single();
    if (!service) return { ok: false, message: "Serviço não encontrado." };
    const { error } = await admin.from("services").update({ active: !service.active }).eq("id", id);
    if (error) return { ok: false, message: "Não foi possível atualizar o serviço." };
  } else {
    const service = demoStore.services.find((s) => s.id === id);
    if (!service) return { ok: false, message: "Serviço não encontrado." };
    service.active = !service.active;
  }

  revalidatePath("/admin/servicos");
  revalidatePath("/servicos");
  return { ok: true, message: "Serviço atualizado." };
}

export async function updateService(
  id: string,
  payload: {
    name: string;
    description: string;
    // Preço/duração podem ficar sem cadastro (nulos): nenhum valor é
    // chutado no lugar — a interface explica a lacuna ao público.
    priceCents: number | null;
    durationMin: number | null;
    category: string;
    active: boolean;
  },
): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const parsed = serviceInput.safeParse(payload);
  if (!parsed.success) return { ok: false, message: "Confira os campos informados." };
  payload = parsed.data;

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin
      .from("services")
      .update({
        name: payload.name,
        description: payload.description,
        price_cents: payload.priceCents,
        duration_min: payload.durationMin,
        category: payload.category,
        active: payload.active,
      })
      .eq("id", id);

    if (error) return { ok: false, message: "Não foi possível salvar o serviço." };
  } else {
    const service = demoStore.services.find((s) => s.id === id);
    if (!service) return { ok: false, message: "Serviço não encontrado." };
    Object.assign(service, payload);
  }

  revalidatePath("/admin/servicos");
  revalidatePath("/servicos");
  revalidatePath("/precos");
  return { ok: true, message: "Serviço atualizado." };
}

export async function updateProfessional(
  id: string,
  payload: { name: string; role: string; bio: string; specialties: string[]; active: boolean },
): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const parsed = professionalInput.safeParse(payload);
  if (!parsed.success) return { ok: false, message: "Confira os campos informados." };
  payload = parsed.data;

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin
      .from("professionals")
      .update({
        name: payload.name,
        role: payload.role,
        bio: payload.bio,
        specialties: payload.specialties,
        active: payload.active,
      })
      .eq("id", id);

    if (error) return { ok: false, message: "Não foi possível salvar o profissional." };
  } else {
    const professional = demoStore.professionals.find((p) => p.id === id);
    if (!professional) return { ok: false, message: "Profissional não encontrado." };
    Object.assign(professional, payload);
  }

  revalidatePath("/admin/equipe");
  revalidatePath("/profissionais");
  return { ok: true, message: "Profissional atualizado." };
}

export async function toggleProfessional(id: string): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { data: professional } = await admin
      .from("professionals")
      .select("active")
      .eq("id", id)
      .single();
    if (!professional) return { ok: false, message: "Profissional não encontrado." };
    const { error } = await admin
      .from("professionals")
      .update({ active: !professional.active })
      .eq("id", id);
    if (error) return { ok: false, message: "Não foi possível atualizar o profissional." };
  } else {
    const professional = demoStore.professionals.find((p) => p.id === id);
    if (!professional) return { ok: false, message: "Profissional não encontrado." };
    professional.active = !professional.active;
  }

  revalidatePath("/admin/equipe");
  revalidatePath("/profissionais");
  return { ok: true, message: "Profissional atualizado." };
}

export async function updateClientNote(id: string, notes: string): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  if (!z.string().max(2000).safeParse(notes).success) {
    return { ok: false, message: "A observação deve ter até 2.000 caracteres." };
  }
  const admin = createAdminClient();
  if (isSupabaseConfigured() && !admin) {
    return { ok: false, message: "Serviço indisponível no momento." };
  }

  if (admin) {
    const { error } = await admin.from("clients").update({ notes }).eq("id", id);
    if (error) return { ok: false, message: "Não foi possível salvar a observação." };
  } else {
    const client = demoStore.clients.find((c) => c.id === id);
    if (!client) return { ok: false, message: "Cliente não encontrado." };
    client.notes = notes || null;
  }

  revalidatePath("/admin/clientes");
  return { ok: true, message: "Observação salva." };
}
