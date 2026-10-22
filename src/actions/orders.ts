"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProducts } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink, orderMessage } from "@/lib/whatsapp";
import { generateCode } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export type OrderFormState = {
  status: "idle" | "success" | "error";
  message: string;
  code?: string;
  whatsappUrl?: string;
  order?: {
    id: string;
    code: string;
    totalCents: number;
    items: OrderItem[];
  };
};

const schema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  phone: z.string().trim().min(8, "Informe um telefone válido com DDD."),
  address: z.string().trim().max(300, "Endereço muito longo.").optional().or(z.literal("")),
  notes: z.string().trim().max(300, "Observações muito longas.").optional().or(z.literal("")),
  items: z.string().min(2, "Seu carrinho está vazio."),
});

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items: String(formData.get("items") ?? ""),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Confira os dados informados." };
  }

  const data = parsed.data;

  let requested: Array<{ productId: string; quantity: number }>;
  try {
    const raw = JSON.parse(data.items) as Array<{ productId: string; quantity: number }>;
    requested = raw.filter((item) => item && item.productId && item.quantity > 0);
  } catch {
    return { status: "error", message: "Não foi possível ler o carrinho. Recarregue a página." };
  }

  if (requested.length === 0) {
    return { status: "error", message: "Seu carrinho está vazio." };
  }

  const products = await getProducts();
  const items: OrderItem[] = [];
  const issues: string[] = [];

  for (const entry of requested) {
    const product = products.find((p) => p.id === entry.productId);
    if (!product) {
      issues.push("Um dos produtos não está mais disponível.");
      continue;
    }
    const quantity = Math.min(entry.quantity, Math.max(product.stock, 0));
    if (quantity <= 0) {
      issues.push(`"${product.name}" está sem estoque.`);
      continue;
    }
    items.push({
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity,
    });
  }

  if (items.length === 0) {
    return {
      status: "error",
      message: issues[0] ?? "Não foi possível montar o pedido.",
    };
  }

  const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const code = generateCode("PD");
  const phoneDigits = data.phone.replace(/\D/g, "");

  const order: Order = {
    id: code,
    code,
    clientName: data.name,
    clientPhone: phoneDigits,
    address: data.address || null,
    notes: data.notes || null,
    totalCents,
    status: "pending",
    paymentMethod: "presencial",
    items,
    createdAt: new Date().toISOString(),
  };

  const admin = createAdminClient();

  if (admin) {
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("phone", phoneDigits)
      .maybeSingle();

    let clientId: string | null = existingClient?.id ?? null;

    if (!clientId) {
      const { data: created } = await admin
        .from("clients")
        .insert({ name: data.name, phone: phoneDigits })
        .select("id")
        .single();
      clientId = created?.id ?? null;
    }

    const { data: inserted, error } = await admin
      .from("orders")
      .insert({
        code,
        client_id: clientId,
        client_name: data.name,
        client_phone: phoneDigits,
        address: data.address || null,
        notes: data.notes || null,
        total_cents: totalCents,
        status: "pending",
        payment_method: "presencial",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return {
        status: "error",
        message: "Não foi possível registrar o pedido. Tente novamente ou fale pelo WhatsApp.",
      };
    }

    const { error: itemsError } = await admin.from("order_items").insert(
      items.map((item) => ({
        order_id: inserted.id,
        product_id: item.productId,
        product_name: item.productName,
        unit_price_cents: item.unitPriceCents,
        quantity: item.quantity,
      })),
    );

    if (itemsError) {
      return { status: "error", message: "Não foi possível salvar os itens do pedido." };
    }
  } else {
    demoStore.orders = [order, ...demoStore.orders];
  }

  revalidatePath("/admin/pedidos");

  const whatsappUrl = buildWhatsAppLink(
    orderMessage({
      code: order.code,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      address: order.address,
      notes: order.notes,
      items: order.items,
      totalCents: order.totalCents,
    }),
  );

  return {
    status: "success",
    message: "Pedido registrado! Finalize a compra pelo WhatsApp.",
    code: order.code,
    whatsappUrl,
    order: { id: order.id, code: order.code, totalCents: order.totalCents, items: order.items },
  };
}
