import { siteConfig } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Booking, Order, Product } from "@/lib/types";

const WHATSAPP_BASE = "https://wa.me";

export function whatsappNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? siteConfig.contact.whatsapp).replace(/\D/g, "");
}

/**
 * Link do WhatsApp. Sem `phone` (número em dígitos E164) cai no contato
 * geral da configuração. Flows de reserva passam o número do profissional
 * escolhido — a solicitação abre no chat de quem vai atender.
 */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const target = (phone ?? whatsappNumber()).replace(/\D/g, "");
  return `${WHATSAPP_BASE}/${target}?text=${encodeURIComponent(message)}`;
}

export function genericContactMessage(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Olá! Gostaria de informações sobre os serviços da barbearia."
  );
}

/**
 * wa.me exige o DDI. Telefones do cliente chegam do formulário sem "55"
 * (só DDD + número). Completa o DDI brasileiro quando faltar, sem trocar
 * nenhum dígito informado.
 */
export function ensureDdi(phoneDigits: string): string {
  const n = phoneDigits.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) return `55${n}`;
  return n;
}

/** Fluxos gerais (contato, loja, dúvidas) continuam no número geral.
 * Fluxos de reserva podem apontar para o profissional com `phone`. */
export function contactLink(message?: string, phone?: string): string {
  return buildWhatsAppLink(message ?? genericContactMessage(), phone);
}

/**
 * Link público de gestão de uma reserva, p/ abrir no site e confirmar ou
 * recusar com login. Só é gerado com a URL base configurada no ambiente
 * (NEXT_PUBLIC_SITE_URL) E com banco/login ativos — nunca um localhost/IP
 * chutado, e nunca vivo em modo demonstração.
 */
export function bookingManageLink(code: string): string | null {
  if (!isSupabaseConfigured()) return null;
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return null;
  return `${raw}/gerenciar/${encodeURIComponent(code)}`;
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
       `Olá, ${siteConfig.name}!`,
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

  const manageUrl = bookingManageLink(booking.code);
  if (manageUrl) {
    // Link em linha própria e sem marcação: URL completa, clicável no
    // WhatsApp e sem pontuação colada no fim.
    lines.push("Gerenciar esta reserva no site:");
    lines.push(manageUrl);
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
