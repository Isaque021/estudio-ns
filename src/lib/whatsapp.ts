import { siteConfig } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";
import type { Booking, Order, Product } from "@/lib/types";

const WHATSAPP_BASE = "https://wa.me";

export function whatsappNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? siteConfig.contact.whatsapp).replace(/\D/g, "");
}

export function buildWhatsAppLink(message: string): string {
  return `${WHATSAPP_BASE}/${whatsappNumber()}?text=${encodeURIComponent(message)}`;
}

export function genericContactMessage(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Olá! Gostaria de informações sobre os serviços da barbearia."
  );
}

export function contactLink(message?: string): string {
  return buildWhatsAppLink(message ?? genericContactMessage());
}

export function bookingRequestMessage(booking: {
  code: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  priceCents: number;
  notes?: string | null;
}): string {
  const lines = [
    `Olá, ${siteConfig.name}! 👋`,
    "",
    "Acabei de fazer um agendamento pelo site e gostaria de confirmar a reserva.",
    "",
    `*Código da reserva:* ${booking.code}`,
    `*Cliente:* ${booking.clientName}`,
    `*Telefone:* ${booking.clientPhone}`,
    `*Serviço:* ${booking.serviceName}`,
    `*Profissional:* ${booking.professionalName}`,
    `*Data:* ${booking.date}`,
    `*Horário:* ${booking.time}`,
    `*Valor:* ${formatCurrency(booking.priceCents)}`,
  ];

  if (booking.notes) {
    lines.push(`*Observações:* ${booking.notes}`);
  }

  lines.push("", "Podem confirmar, por favor? Obrigado!");
  return lines.join("\n");
}

export function orderMessage(order: {
  code: string;
  clientName: string;
  clientPhone: string;
  address?: string | null;
  notes?: string | null;
  items: Array<{ productName: string; quantity: number; unitPriceCents: number }>;
  totalCents: number;
}): string {
  const items = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.productName} — ${formatCurrency(
          item.unitPriceCents * item.quantity,
        )}`,
    )
    .join("\n");

  const lines = [
    `Olá, ${siteConfig.name}! 🛒`,
    "",
    "Finalizei um pedido na loja virtual e gostaria de concluir pelo WhatsApp.",
    "",
    `*Pedido:* ${order.code}`,
    `*Cliente:* ${order.clientName}`,
    `*Telefone:* ${order.clientPhone}`,
    "",
    "*Itens:*",
    items,
    "",
    `*Total:* ${formatCurrency(order.totalCents)}`,
    "*Pagamento:* presencial (no local, na retirada ou na entrega)",
  ];

  if (order.address) lines.push(`*Endereço:* ${order.address}`);
  if (order.notes) lines.push(`*Observações:* ${order.notes}`);

  lines.push("", "Aguardo a confirmação. Obrigado!");
  return lines.join("\n");
}

export function bookingConfirmedMessage(booking: Booking): string {
  return [
    `Olá, ${booking.clientName}! ✂️`,
    "",
    `Seu agendamento na ${siteConfig.name} está *confirmado*.`,
    "",
    `*Serviço:* ${booking.serviceName}`,
    `*Profissional:* ${booking.professionalName}`,
    `*Data:* ${booking.date}`,
    `*Horário:* ${booking.time}`,
    `*Código:* ${booking.code}`,
    "",
    "Qualquer coisa, é só chamar por aqui. Até logo!",
  ].join("\n");
}

export function orderConfirmedMessage(order: Order): string {
  return [
    `Olá, ${order.clientName}! ✅`,
    "",
    `Seu pedido *${order.code}* foi confirmado pela ${siteConfig.name}.`,
    "",
    `*Total:* ${formatCurrency(order.totalCents)}`,
    "*Pagamento:* presencial, na retirada.",
    "",
    "Combinado? Qualquer dúvida é só chamar por aqui.",
  ].join("\n");
}

export function productInquiryMessage(product: Pick<Product, "name" | "priceCents">): string {
  return [
    `Olá, ${siteConfig.name}! 👋`,
    "",
    `Tenho interesse no produto *${product.name}* (${formatCurrency(product.priceCents)}).`,
    "Está disponível para retirada na loja?",
  ].join("\n");
}
