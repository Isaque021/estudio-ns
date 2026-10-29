"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getProducts } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { checkRequestLimits, limitKey } from "@/lib/request-limits";
import { generateCode } from "@/lib/reservation-code";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderItem } from "@/lib/types";
import { cartInput, phoneNumber } from "@/lib/validation";
import {
  buildWhatsAppLink,
  ensureDdi,
  orderMessage,
  whatsappNumber,
} from "@/lib/whatsapp";

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
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  phone: phoneNumber,
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(300).optional(),
  items: z.string().min(2, "Seu carrinho está vazio.").max(12000),
});

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
    items: formData.get("items"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Confira os dados.",
    };
  }

  const input = parsed.data;
  let raw: unknown;

  try {
    raw = JSON.parse(input.items);
  } catch {
    return {
      status: "error",
      message: "Não foi possível ler o carrinho. Recarregue a página.",
    };
  }

  const cart = cartInput.safeParse(raw);

  if (!cart.success) {
    return {
      status: "error",
      message: "Carrinho inválido. Confira os produtos e as quantidades.",
    };
  }

  const shopPhone = ensureDdi(whatsappNumber());

  if (
    !/^\d{12,15}$/.test(shopPhone) ||
    ["5511999999999", "551134567890"].includes(shopPhone)
  ) {
    return {
      status: "error",
      message:
        "A loja ainda não está recebendo pedidos online. O contato de retirada precisa ser configurado pelo estúdio.",
    };
  }

  const phone = input.phone.replace(/\D/g, "");

  const limitError = await checkRequestLimits([
    { key: "orders:global", max: 100, seconds: 3600 },
    {
      key: limitKey("orders:phone", phone),
      max: 5,
      seconds: 900,
    },
  ]);

  if (limitError) {
    return { status: "error", message: limitError };
  }

  const code = generateCode("PD");
  const admin = createAdminClient();

  if (isSupabaseConfigured() && !admin) {
    return {
      status: "error",
      message: "A loja está indisponível no momento.",
    };
  }

  let order: Order;

  if (admin) {
    const { data, error } = await admin.rpc("ns_create_order", {
      p_code: code,
      p_name: input.name,
      p_phone: phone,
      p_address: input.address ?? "",
      p_notes: input.notes ?? "",
      p_items: cart.data,
    });

    if (error || !data) {
      return {
        status: "error",
        message:
          "Não foi possível registrar o pedido. Confira a disponibilidade e tente novamente.",
      };
    }

    const saved = data as {
      id: string;
      code: string;
      totalCents: number;
      items: OrderItem[];
    };

    order = {
      ...saved,
      clientName: input.name,
      clientPhone: phone,
      address: input.address || null,
      notes: input.notes || null,
      status: "pending",
      paymentMethod: "presencial",
      createdAt: new Date().toISOString(),
    };
  } else {
    const products = await getProducts();
    const items: OrderItem[] = [];

    for (const entry of cart.data) {
      const product = products.find(
        (item) => item.id === entry.productId && item.active,
      );

      if (!product || entry.quantity > product.stock) {
        return {
          status: "error",
          message:
            "Um dos produtos não está disponível na quantidade escolhida.",
        };
      }

      items.push({
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: entry.quantity,
      });
    }

    order = {
      id: code,
      code,
      clientName: input.name,
      clientPhone: phone,
      address: input.address || null,
      notes: input.notes || null,
      totalCents: items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0,
      ),
      status: "pending",
      paymentMethod: "presencial",
      items,
      createdAt: new Date().toISOString(),
    };

    demoStore.orders = [order, ...demoStore.orders];
  }

  revalidatePath("/admin/pedidos");

  return {
    status: "success",
    message: "Pedido registrado! Combine a retirada pelo WhatsApp.",
    code: order.code,
    whatsappUrl: buildWhatsAppLink(
      orderMessage({
        code: order.code,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        address: order.address,
        notes: order.notes,
        items: order.items,
        totalCents: order.totalCents,
      }),
      shopPhone,
    ),
    order: {
      id: order.id,
      code: order.code,
      totalCents: order.totalCents,
      items: order.items,
    },
  };
}
