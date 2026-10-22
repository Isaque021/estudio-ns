"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBookedSlots, getProfessionals, getServices } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingRequestMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { generateCode, todayISO } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export type BookingFormState = {
  status: "idle" | "success" | "error";
  message: string;
  code?: string;
  whatsappUrl?: string;
  booking?: {
    id: string;
    code: string;
    serviceName: string;
    professionalName: string;
    date: string;
    time: string;
    priceCents: number;
  };
};

const schema = z.object({
  serviceId: z.string().min(1, "Escolha um serviço."),
  professionalId: z.string().min(1, "Escolha um profissional."),
  date: z.string().min(1, "Escolha uma data."),
  time: z.string().min(1, "Escolha um horário."),
  name: z.string().trim().min(3, "Informe seu nome completo."),
  phone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido com DDD."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  notes: z.string().trim().max(500, "Observações muito longas.").optional().or(z.literal("")),
});

/**
 * Retorna os horários já ocupados para um profissional em uma data.
 * Usado pelo assistente de agendamento para desabilitar slots.
 */
export async function fetchBookedSlots(
  professionalId: string,
  date: string,
): Promise<string[]> {
  if (!professionalId || !date) return [];
  return getBookedSlots(professionalId, date);
}

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = schema.safeParse({
    serviceId: String(formData.get("serviceId") ?? ""),
    professionalId: String(formData.get("professionalId") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: "error",
      message: first?.message ?? "Confira os dados informados.",
    };
  }

  const data = parsed.data;

  if (data.date < todayISO()) {
    return { status: "error", message: "Escolha uma data a partir de hoje." };
  }

  const [services, professionals] = await Promise.all([getServices(), getProfessionals()]);
  const service = services.find((s) => s.id === data.serviceId);
  const professional = professionals.find((p) => p.id === data.professionalId);

  if (!service) return { status: "error", message: "Serviço não encontrado." };
  if (!professional) return { status: "error", message: "Profissional não encontrado." };

  const taken = await getBookedSlots(professional.id, data.date);
  if (taken.includes(data.time)) {
    return {
      status: "error",
      message: "Este horário acabou de ser ocupado. Escolha outro, por favor.",
    };
  }

  const code = generateCode("AG");
  const phoneDigits = data.phone.replace(/\D/g, "");

  const booking: Booking = {
    id: code,
    code,
    clientName: data.name,
    clientPhone: phoneDigits,
    clientEmail: data.email || null,
    serviceId: service.id,
    serviceName: service.name,
    professionalId: professional.id,
    professionalName: professional.name,
    date: data.date,
    time: data.time,
    status: "pending",
    notes: data.notes || null,
    priceCents: service.priceCents,
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
        .insert({ name: data.name, phone: phoneDigits, email: data.email || null })
        .select("id")
        .single();
      clientId = created?.id ?? null;
    }

    const { error } = await admin.from("bookings").insert({
      code,
      client_id: clientId,
      client_name: data.name,
      client_phone: phoneDigits,
      client_email: data.email || null,
      service_id: service.id,
      service_name: service.name,
      professional_id: professional.id,
      professional_name: professional.name,
      scheduled_date: data.date,
      scheduled_time: data.time,
      status: "pending",
      notes: data.notes || null,
      price_cents: service.priceCents,
    });

    if (error) {
      return {
        status: "error",
        message: "Não foi possível salvar o agendamento. Tente novamente ou fale pelo WhatsApp.",
      };
    }
  } else {
    demoStore.bookings = [booking, ...demoStore.bookings];
    const client = demoStore.clients.find((c) => c.phone === phoneDigits);
    if (client) {
      client.totalBookings += 1;
      client.totalSpentCents += service.priceCents;
      client.lastBookingAt = booking.createdAt;
    } else {
      demoStore.clients = [
        {
          id: code,
          name: data.name,
          phone: phoneDigits,
          email: data.email || null,
          notes: null,
          totalBookings: 1,
          totalSpentCents: service.priceCents,
          lastBookingAt: booking.createdAt,
          createdAt: booking.createdAt,
        },
        ...demoStore.clients,
      ];
    }
  }

  revalidatePath("/admin/agendamentos");

  const whatsappUrl = buildWhatsAppLink(
    bookingRequestMessage({
      code: booking.code,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      serviceName: booking.serviceName,
      professionalName: booking.professionalName,
      date: booking.date,
      time: booking.time,
      priceCents: booking.priceCents,
      notes: booking.notes,
    }),
  );

  return {
    status: "success",
    message: "Agendamento registrado! Agora solicite a confirmação pelo WhatsApp.",
    code: booking.code,
    whatsappUrl,
    booking: {
      id: booking.id,
      code: booking.code,
      serviceName: booking.serviceName,
      professionalName: booking.professionalName,
      date: booking.date,
      time: booking.time,
      priceCents: booking.priceCents,
    },
  };
}
