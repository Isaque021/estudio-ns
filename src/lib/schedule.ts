import type {
  Booking,
  BusinessHour,
  ProfessionalHour,
  ScheduleException,
  Service,
} from "@/lib/types";

/**
 * Motor de agenda — funções puras (sem banco, sem I/O).
 *
 * Toda validação de disponibilidade usa datas/horas nominais + o fuso do
 * estúdio (America/Sao_Paulo), independente do fuso onde o servidor roda.
 * Janelas são intervalos em minutos dentro do dia: 0 = 00:00, 1140 = 19:00.
 */
export const STUDIO_TIMEZONE = "America/Sao_Paulo";

export type Interval = { start: number; end: number };

/** "09:30" → 570; inválido/absente → null. */
export function parseHM(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToHM(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const rest = String(minutes % 60).padStart(2, "0");
  return `${hours}:${rest}`;
}

/** Agora no fuso do estúdio (data nominal + minutos do dia). */
export function nowInStudioTZ(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
}

/** Datas nominais não dependem de fuso para dar o dia da semana. */
export function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

function subtractInterval(windows: Interval[], cut: Interval): Interval[] {
  const result: Interval[] = [];
  for (const window of windows) {
    if (cut.end <= window.start || cut.start >= window.end) {
      result.push(window);
      continue;
    }
    if (cut.start > window.start) {
      result.push({ start: window.start, end: Math.min(cut.start, window.end) });
    }
    if (cut.end < window.end) {
      result.push({ start: Math.max(cut.end, window.start), end: window.end });
    }
  }
  return result.filter((window) => window.end > window.start);
}

/**
 * Janelas de atendimento do dia para um profissional:
 * padrão do estúdio → sobreposição semanal → exceções do dia.
 * Dia fechado ou folga = [].
 */
export function resolveDayWindows(options: {
  date: string;
  globalHours: BusinessHour[];
  professionalHours: ProfessionalHour[];
  exceptions: ScheduleException[];
}): Interval[] {
  const weekday = weekdayOf(options.date);
  const overlay = options.professionalHours.find((hour) => hour.weekday === weekday);
  const base = overlay ?? options.globalHours.find((hour) => hour.weekday === weekday);

  let windows: Interval[] = [];
  if (base && !base.closed && base.opensAt && base.closesAt) {
    const start = parseHM(base.opensAt);
    const end = parseHM(base.closesAt);
    if (start != null && end != null && end > start) windows = [{ start, end }];
  }

  for (const exception of options.exceptions) {
    const start = parseHM(exception.startAt);
    const end = parseHM(exception.endAt);
    switch (exception.kind) {
      case "day-off":
        windows = [];
        break;
      case "open-late":
        if (start != null) {
          windows = windows
            .map((window) => ({ ...window, start: Math.max(window.start, start) }))
            .filter((window) => window.end > window.start);
        }
        break;
      case "close-early":
        if (end != null) {
          windows = windows
            .map((window) => ({ ...window, end: Math.min(window.end, end) }))
            .filter((window) => window.end > window.start);
        }
        break;
      case "extra-window":
        if (start != null && end != null && end > start) {
          windows.push({ start, end });
        }
        break;
      case "block-range":
        if (start != null && end != null && end > start) {
          windows = subtractInterval(windows, { start, end });
        }
        break;
    }
  }

  return windows
    .map((window) => ({ start: Math.max(0, window.start), end: Math.min(window.end, 1440) }))
    .filter((window) => window.end > window.start)
    .sort((a, b) => a.start - b.start);
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Solicitação pendente só marca horário enquanto o prazo de guarda vale. */
export function isPendingValid(
  booking: Pick<Booking, "createdAt">,
  holdMinutes: number,
  now: number = Date.now(),
): boolean {
  return now < new Date(booking.createdAt).getTime() + holdMinutes * 60_000;
}

/** Momento em que a solicitação perde o prazo (para exibir). */
export function pendingValidUntil(createdAt: string, holdMinutes: number): Date {
  return new Date(new Date(createdAt).getTime() + holdMinutes * 60_000);
}

/** "24/10/2026 10:20" no fuso do estúdio. */
export function formatHoldDeadline(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STUDIO_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Intervalos que bloqueiam a agenda do profissional no dia:
 * confirmadas sempre; pendentes só dentro do prazo; histórico não bloqueia.
 * Sem duração gravada, usa a do serviço no cadastro (30 min como último
 * recurso — exportado para os casos legados).
 */
export function busyIntervalsFromBookings(options: {
  bookings: Booking[];
  services: Service[];
  holdMinutes: number;
  excludeBookingId?: string;
  now?: number;
}): Interval[] {
  const durationByService = new Map(options.services.map((service) => [service.id, service.durationMin]));
  const intervals: Interval[] = [];

  for (const booking of options.bookings) {
    if (options.excludeBookingId && booking.id === options.excludeBookingId) continue;
    if (booking.status !== "confirmed" && booking.status !== "pending") continue;
    if (booking.status === "pending" && !isPendingValid(booking, options.holdMinutes, options.now ?? Date.now())) continue;

    const start = parseHM(booking.time);
    if (start == null) continue;
    const durationMin =
      booking.durationMin ?? durationByService.get(booking.serviceId) ?? 30;
    intervals.push({ start, end: Math.min(start + durationMin, 1440) });
  }

  return intervals;
}

/**
 * Horários possíveis do dia: alinhados ao início de cada janela, avançando
 * de `intervalMin` em `intervalMin`, exigindo a duração completa dentro da
 * janela, sem topar reserva existente nem passado (quando o dia é hoje).
 */
export function slotsForDay(options: {
  windows: Interval[];
  durationMin: number;
  intervalMin: number;
  busy: Interval[];
  isToday: boolean;
  now?: { minutes: number };
}): string[] {
  const slots: string[] = [];
  for (const window of options.windows) {
    for (let start = window.start; start + options.durationMin <= window.end; start += options.intervalMin) {
      if (options.isToday && (options.now?.minutes ?? 0) >= start) continue;
      const candidate: Interval = { start, end: start + options.durationMin };
      if (options.busy.some((busy) => intervalsOverlap(busy, candidate))) continue;
      slots.push(minutesToHM(start));
    }
  }
  return slots;
}

/** [início, início+duração) precisa caber inteiro em uma janela aberta. */
export function intervalFitsWindow(start: number, durationMin: number, windows: Interval[]): boolean {
  return windows.some((window) => start >= window.start && start + durationMin <= window.end);
}

/** Rótulo legível das janelas do dia, ex.: "09:00–19:00" ou "09:00–12:00, 14:00–19:00". */
export function windowsLabel(windows: Interval[]): string {
  return windows.map((window) => `${minutesToHM(window.start)}–${minutesToHM(window.end)}`).join(", ");
}
