"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { checkRequestLimits, limitKey } from "@/lib/request-limits";

import {
  bookingFromRow,
  getBookingSettings,
  getDayAgenda,
  getProfessionals,
  getServices,
} from "@/lib/data";
import { demoHours, demoServices } from "@/lib/demo-data";
import { demoStore } from "@/lib/demo-store";
import {
  busyIntervalsFromBookings,
  formatHoldDeadline,
  intervalFitsWindow,
  intervalsOverlap,
  nowInStudioTZ,
  parseHM,
  pendingValidUntil,
  resolveDayWindows,
  slotsForDay,
  windowsLabel,
} from "@/lib/schedule";
import { bookingSlotIntervalMin } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Booking, Professional, Service } from "@/lib/types";
import { generateCode } from "@/lib/reservation-code";
import {
  bookingRequestMessage,
  buildWhatsAppLink,
} from "@/lib/whatsapp";

export type BookingFormState = {
  status: "idle" | "success" | "error";
  message: string;
  code?: string;
  whatsappUrl?: string;
  expiresAt?: string;
  holdMinutes?: number;
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

type AvailableSlots = {
  slots: string[];
  closed: boolean;
  windowText: string;
  message: string | null;
};

type BookingSelection =
  | { ok: false; message: string }
  | {
    ok: true;
    services: Service[];
    service: Service;
    professional: Professional;
    durationMin: number;
    priceCents: number;
  };

const onlineProfessionals = new Set(["isaque", "neto"]);

const whatsappServices = new Set([
  "unhas",
  "unhas-de-gel",
  "pedicure",
  "calista",
  "depilacao",
  "design-de-sobrancelhas",
]);

const messages = {
  conflict:
    "Este horário acabou de ser ocupado. Escolha outro horário, por favor.",
  saveError:
    "Não foi possível registrar a reserva. Tente novamente ou fale pelo WhatsApp.",
  incompleteService:
    "Este serviço ainda não tem duração e valor completos no cadastro. Combine o atendimento pelo WhatsApp.",
  whatsappOnly:
    "Este atendimento é combinado diretamente com a profissional pelo WhatsApp. Acesse a página Unhas & Beleza.",
};

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Escolha uma data válida.");

const schema = z.object({
  serviceId: z
    .string()
    .trim()
    .min(1, "Escolha um serviço.")
    .max(120),

  professionalId: z
    .string()
    .trim()
    .min(1, "Escolha um profissional.")
    .max(120),

  date: dateSchema,

  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escolha um horário válido."),

  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "O nome deve ter até 120 caracteres."),

  phone: z
    .string()
    .trim()
    .max(30, "Informe um telefone válido com DDD.")
    .refine((value) => {
      if (!/^[+\d\s().-]+$/.test(value)) return false;

      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Informe um telefone válido com DDD."),

  email: z
    .string()
    .trim()
    .max(254, "E-mail muito longo.")
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(500, "Observações muito longas.")
    .optional()
    .or(z.literal("")),

  idempotencyKey: z
    .string()
    .uuid("Atualize a página e tente enviar novamente."),
});

const availabilitySchema = schema.pick({
  professionalId: true,
  serviceId: true,
  date: true,
});

type BookingInput = z.infer<typeof schema>;

function bookingError(message: string): BookingFormState {
  return { status: "error", message };
}

function unavailable(message: string): AvailableSlots {
  return {
    slots: [],
    closed: true,
    windowText: "",
    message,
  };
}

async function getBookingSelection(
  serviceId: string,
  professionalId: string,
): Promise<BookingSelection> {
  const [services, professionals] = await Promise.all([
    getServices(),
    getProfessionals(),
  ]);

  const service = services.find(
    (item) => item.id === serviceId && item.active,
  );

  if (!service) {
    return { ok: false, message: "Serviço indisponível." };
  }

  const professional = professionals.find(
    (item) => item.id === professionalId && item.active,
  );

  if (!professional) {
    return { ok: false, message: "Profissional indisponível." };
  }

  if (
    !onlineProfessionals.has(professional.slug) ||
    whatsappServices.has(service.slug)
  ) {
    return { ok: false, message: messages.whatsappOnly };
  }

  if (!professional.specialties.includes(service.name)) {
    return {
      ok: false,
      message: "Este profissional não atende o serviço escolhido.",
    };
  }

  if (!professional.phone?.trim()) {
    return {
      ok: false,
      message:
        "O contato deste profissional está indisponível. Fale com o estúdio.",
    };
  }

  const durationMin = service.durationMin;
  const priceCents = service.priceCents;

  if (
    durationMin == null ||
    !Number.isInteger(durationMin) ||
    durationMin <= 0 ||
    priceCents == null ||
    !Number.isInteger(priceCents) ||
    priceCents < 0
  ) {
    return { ok: false, message: messages.incompleteService };
  }

  return {
    ok: true,
    services,
    service,
    professional,
    durationMin,
    priceCents,
  };
}

function successState(
  booking: Booking,
  holdMinutes: number,
  professionalPhone: string,
): BookingFormState {
  return {
    status: "success",
    message:
      booking.status === "confirmed"
        ? "Este agendamento já está confirmado."
        : "Solicitação registrada! Envie os detalhes pelo WhatsApp e aguarde a confirmação da equipe.",
    code: booking.code,
    whatsappUrl: buildWhatsAppLink(
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
      professionalPhone,
    ),
    expiresAt: formatHoldDeadline(
      pendingValidUntil(booking.createdAt, holdMinutes),
    ),
    holdMinutes,
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

function replayState(
  booking: Booking,
  input: BookingInput,
  holdMinutes: number,
  professionalPhone: string,
): BookingFormState {
  const sameRequest =
    booking.serviceId === input.serviceId &&
    booking.professionalId === input.professionalId &&
    booking.date === input.date &&
    booking.time.slice(0, 5) === input.time &&
    booking.clientName === input.name &&
    booking.clientPhone.replace(/\D/g, "") ===
    input.phone.replace(/\D/g, "") &&
    (booking.clientEmail ?? "") === (input.email ?? "") &&
    (booking.notes ?? "") === (input.notes ?? "");

  if (!sameRequest) {
    return bookingError(
      "Esta tentativa já foi utilizada. Atualize a página para fazer outra reserva.",
    );
  }

  const createdAt = new Date(booking.createdAt).getTime();
  const expired =
    !Number.isFinite(createdAt) ||
    (booking.status === "pending" &&
      createdAt + holdMinutes * 60_000 <= Date.now());

  if (
    expired ||
    !["pending", "confirmed"].includes(booking.status)
  ) {
    return bookingError(
      "Esta solicitação não está mais disponível. Atualize a página e escolha um horário.",
    );
  }

  return successState(booking, holdMinutes, professionalPhone);
}

function isConflictError(message: string, code?: string): boolean {
  return (
    code === "23505" ||
    code === "23P01" ||
    /Horário em conflito|Horário já reservado|duplicate key/i.test(message)
  );
}

export async function fetchAvailableSlots(
  professionalId: string,
  date: string,
  serviceId: string,
): Promise<AvailableSlots> {
  const parsed = availabilitySchema.safeParse({
    professionalId,
    date,
    serviceId,
  });

  if (!parsed.success) {
    return unavailable(
      "Escolha um serviço, um profissional e uma data válida.",
    );
  }

  const input = parsed.data;

  const limitError = await checkRequestLimits([
    { key: "availability:global", max: 600, seconds: 300 },
  ]);

  if (limitError) return unavailable(limitError);

  const now = nowInStudioTZ();

  if (input.date < now.date) {
    return unavailable("Esta data já passou.");
  }

  const selection = await getBookingSelection(
    input.serviceId,
    input.professionalId,
  );

  if (!selection.ok) {
    return unavailable(selection.message);
  }

  const { services, professional, durationMin } = selection;

  const agenda = await getDayAgenda({
    professionalId: professional.id,
    date: input.date,
    services,
  });

  if (agenda.windows.length === 0) {
    return unavailable("Fechado neste dia.");
  }

  const slots = slotsForDay({
    windows: agenda.windows,
    durationMin,
    intervalMin: bookingSlotIntervalMin,
    busy: agenda.busy,
    isToday: input.date === now.date,
    now,
  });

  return {
    slots,
    closed: false,
    windowText: windowsLabel(agenda.windows),
    message:
      slots.length === 0
        ? "Não há horários livres nesta data."
        : null,
  };
}

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = schema.safeParse({
    serviceId: formData.get("serviceId"),
    professionalId: formData.get("professionalId"),
    date: formData.get("date"),
    time: formData.get("time"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    notes: formData.get("notes") ?? "",
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return bookingError(
      parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    );
  }

  const input = parsed.data;
  const phoneKey = input.phone.replace(/\D/g, "");

  const limitError = await checkRequestLimits([
    { key: "booking:global", max: 200, seconds: 3600 },
    {
      key: limitKey("booking:phone", phoneKey),
      max: 5,
      seconds: 900,
    },
  ]);

  if (limitError) return bookingError(limitError);

  const now = nowInStudioTZ();

  if (input.date < now.date) {
    return bookingError("Escolha uma data a partir de hoje.");
  }

  const start = parseHM(input.time);

  if (start == null) {
    return bookingError("Escolha um horário válido.");
  }

  if (input.date === now.date && start <= now.minutes) {
    return bookingError(
      "Esse horário já passou. Escolha outro horário.",
    );
  }

  const selection = await getBookingSelection(
    input.serviceId,
    input.professionalId,
  );

  if (!selection.ok) {
    return bookingError(selection.message);
  }

  const {
    services,
    service,
    professional,
    durationMin,
    priceCents,
  } = selection;

  const { holdMinutes } = await getBookingSettings();
  const configured = isSupabaseConfigured();
  const admin = configured ? createAdminClient() : null;

  if (configured && !admin) {
    return bookingError(messages.saveError);
  }

  if (admin) {
    const { data: existing, error } = await admin
      .from("bookings")
      .select("*")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (error) {
      return bookingError(messages.saveError);
    }

    if (existing) {
      return replayState(
        bookingFromRow(existing as Record<string, unknown>),
        input,
        holdMinutes,
        professional.phone,
      );
    }
  } else {
    const existing = demoStore.idempotency[input.idempotencyKey];

    if (existing) {
      return replayState(
        existing,
        input,
        holdMinutes,
        professional.phone,
      );
    }
  }

  const agenda = admin
    ? await getDayAgenda({
      professionalId: professional.id,
      date: input.date,
      services,
    })
    : {
      windows: resolveDayWindows({
        date: input.date,
        globalHours: demoHours,
        professionalHours: demoStore.professionalHours.filter(
          (item) => item.professionalId === professional.id,
        ),
        exceptions: demoStore.scheduleExceptions.filter(
          (item) =>
            item.professionalId === professional.id &&
            item.date === input.date,
        ),
      }),
      busy: busyIntervalsFromBookings({
        bookings: demoStore.bookings.filter(
          (booking) =>
            booking.professionalId === professional.id &&
            booking.date === input.date,
        ),
        services: demoServices,
        holdMinutes,
      }),
    };

  if (agenda.windows.length === 0) {
    return bookingError(
      "O profissional está fechado nesta data. Escolha outro dia.",
    );
  }

  if (!intervalFitsWindow(start, durationMin, agenda.windows)) {
    return bookingError(
      "O atendimento não cabe no expediente nesse horário. Escolha outro horário.",
    );
  }

  const requestedInterval = {
    start,
    end: start + durationMin,
  };

  if (
    agenda.busy.some((busy) =>
      intervalsOverlap(busy, requestedInterval),
    )
  ) {
    return bookingError(messages.conflict);
  }

  const code = generateCode("AG");
  const phone = input.phone.replace(/\D/g, "");

  if (admin) {
    const { data: existingClient, error: lookupError } = await admin
      .from("clients")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (lookupError) {
      return bookingError(messages.saveError);
    }

    let clientId: string | null = existingClient?.id ?? null;

    if (!clientId) {
      const { data: createdClient, error: insertClientError } =
        await admin
          .from("clients")
          .insert({
            name: input.name,
            phone,
            email: input.email || null,
          })
          .select("id")
          .single();

      if (insertClientError) {
        if (insertClientError.code !== "23505") {
          return bookingError(messages.saveError);
        }

        const { data: concurrentClient, error: retryError } =
          await admin
            .from("clients")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();

        if (retryError || !concurrentClient) {
          return bookingError(messages.saveError);
        }

        clientId = String(concurrentClient.id);
      } else if (createdClient) {
        clientId = String(createdClient.id);
      }
    }

    if (!clientId) {
      return bookingError(messages.saveError);
    }

    // O banco também verifica conflitos entre solicitações simultâneas.
    const { data: inserted, error } = await admin
      .from("bookings")
      .insert({
        code,
        client_id: clientId,
        client_name: input.name,
        client_phone: phone,
        client_email: input.email || null,
        service_id: service.id,
        service_name: service.name,
        professional_id: professional.id,
        professional_name: professional.name,
        scheduled_date: input.date,
        scheduled_time: input.time,
        status: "pending",
        notes: input.notes || null,
        price_cents: priceCents,
        duration_minutes: durationMin,
        idempotency_key: input.idempotencyKey,
      })
      .select("*")
      .single();

    if (error || !inserted) {
      if (!isConflictError(error?.message ?? "", error?.code)) {
        return bookingError(messages.saveError);
      }

      const { data: repeated, error: replayError } = await admin
        .from("bookings")
        .select("*")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (!replayError && repeated) {
        return replayState(
          bookingFromRow(repeated as Record<string, unknown>),
          input,
          holdMinutes,
          professional.phone,
        );
      }

      return bookingError(messages.conflict);
    }

    revalidatePath("/admin/agendamentos");
    revalidatePath("/admin/clientes");

    return successState(
      bookingFromRow(inserted as Record<string, unknown>),
      holdMinutes,
      professional.phone,
    );
  }

  // A gravação demonstrativa permanece sem novos awaits após a checagem.
  const booking: Booking = {
    id: code,
    code,
    clientName: input.name,
    clientPhone: phone,
    clientEmail: input.email || null,
    serviceId: service.id,
    serviceName: service.name,
    professionalId: professional.id,
    professionalName: professional.name,
    date: input.date,
    time: input.time,
    status: "pending",
    notes: input.notes || null,
    priceCents,
    durationMin,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };

  demoStore.bookings = [booking, ...demoStore.bookings];
  demoStore.idempotency[input.idempotencyKey] = booking;

  const client = demoStore.clients.find(
    (item) => item.phone === phone,
  );

  if (client) {
    client.totalBookings += 1;
    client.totalSpentCents += priceCents;
    client.lastBookingAt = booking.createdAt;
  } else {
    demoStore.clients = [
      {
        id: code,
        name: input.name,
        phone,
        email: input.email || null,
        notes: null,
        totalBookings: 1,
        totalSpentCents: priceCents,
        lastBookingAt: booking.createdAt,
        createdAt: booking.createdAt,
      },
      ...demoStore.clients,
    ];
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/clientes");

  return successState(booking, holdMinutes, professional.phone);
}