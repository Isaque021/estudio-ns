"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/auth";
import { demoStore } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_STATUSES, ORDER_STATUSES } from "@/lib/types";
import type { BookingStatus, OrderStatus, StockMovement } from "@/lib/types";

export type ActionResult = {
  ok: boolean;
  message: string;
};

async function authorized(): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(session);
}

/* -------------------------------------------------------------------------- */
/*  Agendamentos                                                               */
/* -------------------------------------------------------------------------- */

export async function setBookingStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };
  if (!BOOKING_STATUSES.includes(status)) return { ok: false, message: "Status inválido." };

  const admin = createAdminClient();

  if (admin) {
    const { error } = await admin
      .from("bookings")
      .update({
        status,
        confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) return { ok: false, message: "Não foi possível atualizar o agendamento." };
  } else {
    const booking = demoStore.bookings.find((b) => b.id === id);
    if (!booking) return { ok: false, message: "Agendamento não encontrado." };
    booking.status = status;
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin");
  return { ok: true, message: "Agendamento atualizado." };
}

/* -------------------------------------------------------------------------- */
/*  Pedidos                                                                    */
/* -------------------------------------------------------------------------- */

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };
  if (!ORDER_STATUSES.includes(status)) return { ok: false, message: "Status inválido." };

  const admin = createAdminClient();

  if (admin) {
    const { data: previous } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (!previous) return { ok: false, message: "Pedido não encontrado." };

    const { error } = await admin
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) return { ok: false, message: "Não foi possível atualizar o pedido." };

    // Baixa de estoque na primeira confirmação do pedido.
    if (previous.status === "pending" && status !== "cancelled") {
      await admin.rpc("finalize_order", { p_order_id: id });
    }
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

  const admin = createAdminClient();

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

  const admin = createAdminClient();

  if (admin) {
    const { error } = await admin.from("products").insert({
      name: payload.name,
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
  if (!Number.isFinite(quantity) || quantity === 0) {
    return { ok: false, message: "Informe uma quantidade válida." };
  }

  const admin = createAdminClient();

  if (admin) {
    const { data: product, error: readError } = await admin
      .from("products")
      .select("id, stock")
      .eq("id", productId)
      .single();

    if (readError || !product) return { ok: false, message: "Produto não encontrado." };

    const delta = type === "in" ? Math.abs(quantity) : type === "out" ? -Math.abs(quantity) : quantity;
    const nextStock = Math.max(product.stock + delta, 0);

    const { error } = await admin
      .from("products")
      .update({ stock: nextStock })
      .eq("id", productId);

    if (error) return { ok: false, message: "Não foi possível atualizar o estoque." };

    await admin.from("stock_movements").insert({
      product_id: productId,
      type,
      quantity: Math.abs(quantity),
      note: note || null,
    });
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
    priceCents: number;
    durationMin: number;
    category: string;
    active: boolean;
  },
): Promise<ActionResult> {
  if (!(await authorized())) return { ok: false, message: "Não autorizado." };

  const admin = createAdminClient();

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

  const admin = createAdminClient();

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

  const admin = createAdminClient();

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
