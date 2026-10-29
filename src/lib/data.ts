import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAdminSession } from "@/lib/auth";
import { demoStore } from "@/lib/demo-store";
import {
  demoGallery,
  demoHours,
  demoProfessionals,
  demoServices,
} from "@/lib/demo-data";
import type {
  AgendaSettings,
  Booking,
  BookingStatus,
  BusinessHour,
  Client,
  DashboardReport,
  GalleryItem,
  Order,
  OrderStatus,
  Product,
  Professional,
  ProfessionalHour,
  ScheduleException,
  Service,
  StockMovement,
} from "@/lib/types";
import {
  busyIntervalsFromBookings,
  intervalsOverlap,
  intervalFitsWindow,
  nowInStudioTZ,
  parseHM,
  resolveDayWindows,
} from "@/lib/schedule";

/**
 * Camada de dados.
 *
 * Quando o Supabase está configurado, todas as leituras vêm do PostgreSQL.
 * Sem configuração, a aplicação usa a base de demonstração local, garantindo
 * que o site funcione (e possa ser avaliado) antes do deploy do banco.
 */

export const demoMode = !isSupabaseConfigured();

/**
 * Papel da sessão atual, para leituras administrativas. O cliente
 * service_role ignora RLS, então o ESCOPO é aplicado aqui, no servidor:
 * admin vê tudo; profissional vê o próprio; staff genérico não vê lista.
 */
async function staffScope(): Promise<{ admin: boolean; professionalId: string | null; allowed: boolean }> {
  const session = await getAdminSession();
  return {
    admin: session?.role === "admin",
    professionalId: session?.professionalId ?? null,
    allowed: session?.role === "admin" || session?.role === "professional",
  };
}

async function db() {
  if (demoMode) return null;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function adminDb() {
  if (demoMode) return null;
  return createServerClient();
}

/* -------------------------------------------------------------------------- */
/*  Mapeadores                                                                 */
/* -------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

function toService(row: Row): Service {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    // Preço e duração podem não estar cadastrados (serviços novos do
    // estúdio): null flui até a interface, que omite ou bloqueia.
    priceCents: row.price_cents == null ? null : Number(row.price_cents),
    durationMin: row.duration_min == null ? null : Number(row.duration_min),
    category: String(row.category ?? ""),
    imageUrl: String(row.image_url ?? "/images/service-01.svg"),
    active: Boolean(row.active ?? true),
    position: Number(row.position ?? 0),
  };
}

function toProfessional(row: Row): Professional {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    role: String(row.role ?? ""),
    bio: String(row.bio ?? ""),
    photoUrl: String(row.photo_url ?? "/images/pro-01.svg"),
    phone: String(row.phone ?? ""),
    specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : [],
    active: Boolean(row.active ?? true),
    position: Number(row.position ?? 0),
  };
}

function toGalleryItem(row: Row): GalleryItem {
  return {
    id: String(row.id),
    title: String(row.title),
    imageUrl: String(row.image_url),
    category: String(row.category ?? ""),
    position: Number(row.position ?? 0),
  };
}

function toBusinessHour(row: Row): BusinessHour {
  return {
    weekday: Number(row.weekday),
    label: WEEKDAY_LABELS[Number(row.weekday)] ?? "",
    opensAt: row.opens_at ? String(row.opens_at).slice(0, 5) : null,
    closesAt: row.closes_at ? String(row.closes_at).slice(0, 5) : null,
    closed: Boolean(row.closed ?? false),
  };
}

function toProduct(row: Row): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    priceCents: Number(row.price_cents ?? 0),
    compareAtCents: row.compare_at_cents == null ? null : Number(row.compare_at_cents),
    stock: Number(row.stock ?? 0),
    sku: String(row.sku ?? ""),
    category: String(row.category ?? ""),
    imageUrl: String(row.image_url ?? "/images/product-01.svg"),
    active: Boolean(row.active ?? true),
  };
}

export function bookingFromRow(row: Row): Booking {
  return {
    id: String(row.id),
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
    status: (row.status as BookingStatus) ?? "pending",
    notes: row.notes ? String(row.notes) : null,
    priceCents: Number(row.price_cents ?? 0),
    createdAt: String(row.created_at),
    durationMin: row.duration_minutes == null ? undefined : Number(row.duration_minutes),
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
  };
}

function toOrder(row: Row, items: Row[] = []): Order {
  return {
    id: String(row.id),
    code: String(row.code),
    clientName: String(row.client_name),
    clientPhone: String(row.client_phone),
    address: row.address ? String(row.address) : null,
    notes: row.notes ? String(row.notes) : null,
    totalCents: Number(row.total_cents ?? 0),
    status: (row.status as OrderStatus) ?? "pending",
    paymentMethod: String(row.payment_method ?? "presencial"),
    items: items.map((item) => ({
      productId: String(item.product_id ?? ""),
      productName: String(item.product_name),
      unitPriceCents: Number(item.unit_price_cents ?? 0),
      quantity: Number(item.quantity ?? 1),
    })),
    createdAt: String(row.created_at),
  };
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/* -------------------------------------------------------------------------- */
/*  Leitura pública                                                            */
/* -------------------------------------------------------------------------- */

export async function getServices(): Promise<Service[]> {
  const supabase = await db();
  if (!supabase) return demoServices.filter((s) => s.active);

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  // Com banco configurado, NUNCA substitui por dados de demonstração:
  // erro e catálogo vazio respondem vazio (o site mostra o estado real).
  if (error || !data || data.length === 0) {
    if (error) console.error("getServices:", error.message);
    return [];
  }
  return (data as Row[]).map(toService);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await getServices();
  return services.find((s) => s.slug === slug) ?? null;
}

export async function getProfessionals(): Promise<Professional[]> {
  const supabase = await db();
  if (!supabase) return demoProfessionals.filter((p) => p.active);

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("getProfessionals:", error.message);
    return [];
  }
  return (data as Row[]).map(toProfessional);
}

export async function getGallery(): Promise<GalleryItem[]> {
  const supabase = await db();
  if (!supabase) return demoGallery;

  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("getGallery:", error.message);
    return [];
  }
  return (data as Row[]).map(toGalleryItem);
}

export async function getBusinessHours(): Promise<BusinessHour[]> {
  const supabase = await db();
  if (!supabase) return demoHours;

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .order("weekday", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("getBusinessHours:", error.message);
    return [];
  }
  return (data as Row[]).map(toBusinessHour);
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await db();
  if (!supabase) return demoStore.products.filter((p) => p.active);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("getProducts:", error.message);
    return [];
  }
  return (data as Row[]).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(productId: string, limit = 3): Promise<Product[]> {
  const products = await getProducts();
  const current = products.find((p) => p.id === productId);
  if (!current) return products.slice(0, limit);

  const sameCategory = products.filter(
    (p) => p.id !== productId && p.category === current.category,
  );
  const others = products.filter((p) => p.id !== productId && p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*  Agenda                                                                     */
/* -------------------------------------------------------------------------- */

export async function getBookingSettings(): Promise<AgendaSettings> {
  const supabase = await db();
  if (!supabase) return demoStore.settings;

  const { data } = await supabase
    .from("booking_settings")
    .select("hold_minutes")
    .limit(1)
    .maybeSingle();

  const fallback = Math.max(1, Number(process.env.BOOKING_HOLD_MINUTES ?? 30) || 30);
  return { holdMinutes: Math.max(1, Number(data?.hold_minutes ?? fallback) || fallback) };
}

async function getProfessionalHours(): Promise<ProfessionalHour[]> {
  const supabase = await db();
  if (!supabase) return demoStore.professionalHours;

  const { data, error } = await supabase.from("professional_hours").select("*");
  if (error || !data) throw new Error("Não foi possível consultar o expediente.");
  return (data as Row[]).map((row) => ({
    professionalId: String(row.professional_id),
    weekday: Number(row.weekday),
    opensAt: row.opens_at ? String(row.opens_at).slice(0, 5) : null,
    closesAt: row.closes_at ? String(row.closes_at).slice(0, 5) : null,
    closed: Boolean(row.closed),
  }));
}

async function getScheduleExceptions(): Promise<ScheduleException[]> {
  const supabase = demoMode ? null : createAdminClient();
  if (!demoMode && !supabase) throw new Error("Credencial do servidor ausente.");
  if (!supabase) return demoStore.scheduleExceptions;

  const { data, error } = await supabase
    .from("professional_exceptions")
    .select("*")
    .order("scheduled_date", { ascending: true });
  if (error || !data) throw new Error("Nao foi possivel consultar os bloqueios da agenda.");
  return (data as Row[]).map((row) => ({
    id: String(row.id),
    professionalId: String(row.professional_id),
    date: String(row.scheduled_date),
    kind: (row.kind as ScheduleException["kind"]) ?? "block-range",
    startAt: row.start_time ? String(row.start_time).slice(0, 5) : null,
    endAt: row.end_time ? String(row.end_time).slice(0, 5) : null,
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  }));
}

async function getBookingsForDay(professionalId: string, date: string): Promise<Booking[]> {
  const supabase = demoMode ? null : createAdminClient();
  if (!demoMode && !supabase) throw new Error("Credencial do servidor ausente.");
  if (!supabase) {
    return demoStore.bookings.filter(
      (b) =>
        b.professionalId === professionalId &&
        b.date === date &&
        (b.status === "pending" || b.status === "confirmed"),
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("scheduled_date", date)
    .in("status", ["pending", "confirmed"]);

  if (error || !data) throw new Error("Nao foi possivel consultar a disponibilidade.");
  return (data as Row[]).map(bookingFromRow);
}

/**
 * Estado da agenda do profissional em um dia: janelas de atendimento
 * (padrão → individual → exceções) e intervalos reservados (confirmadas +
 * pendentes dentro do prazo).
 */
export async function getDayAgenda(options: {
  professionalId: string;
  date: string;
  services: Service[];
  excludeBookingId?: string;
}) {
  const [globalHours, proHours, exceptions, settings, bookings] = await Promise.all([
    getBusinessHours(),
    getProfessionalHours(),
    getScheduleExceptions(),
    getBookingSettings(),
    getBookingsForDay(options.professionalId, options.date),
  ]);

  const windows = resolveDayWindows({
    date: options.date,
    globalHours,
    professionalHours: proHours.filter((h) => h.professionalId === options.professionalId),
    // Exceção vale só no próprio dia ajustado.
    exceptions: exceptions.filter(
      (e) => e.professionalId === options.professionalId && e.date === options.date,
    ),
  });

  const busy = busyIntervalsFromBookings({
    bookings,
    services: options.services,
    holdMinutes: settings.holdMinutes,
    excludeBookingId: options.excludeBookingId,
  });

  return { windows, busy, settings, globalHours };
}

export async function getScheduleData(): Promise<{
  hours: ProfessionalHour[];
  exceptions: ScheduleException[];
  settings: AgendaSettings;
}> {
  const session = await getAdminSession();
  if (!session) throw new Error("Nao autorizado.");

  const [hours, exceptions, settings] = await Promise.all([
    getProfessionalHours(),
    getScheduleExceptions(),
    getBookingSettings(),
  ]);

  if (session.role === "admin") {
    return { hours, exceptions, settings };
  }

  return {
    hours: hours.filter((item) => item.professionalId === session.professionalId),
    exceptions: exceptions.filter((item) => item.professionalId === session.professionalId),
    settings,
  };
}

/**
 * Confirmação de pendente expirado no painel: revalida a agenda na hora.
 * Retorna mensagem de conflito ou null quando pode confirmar.
 */
export async function validatePendingConfirm(
  booking: Booking,
  services: Service[],
): Promise<string | null> {
  const servicesList = services.length > 0 ? services : await getServices();
  const duration =
    booking.durationMin ?? servicesList.find((s) => s.id === booking.serviceId)?.durationMin ?? 30;
  const start = parseHM(booking.time);
  if (start == null) return "Horário da reserva é inválido.";

  const agenda = await getDayAgenda({
    professionalId: booking.professionalId,
    date: booking.date,
    services: servicesList,
    excludeBookingId: booking.id,
  });

  if (!intervalFitsWindow(start, duration, agenda.windows)) {
    return "Fora do expediente do profissional neste dia. Recuse e combine outro horário.";
  }
  if (agenda.busy.some((busy) => intervalsOverlap(busy, { start, end: start + duration }))) {
    return "Solicitação expirou e o horário já estava ocupado. Recuse a solicitação.";
  }
  const now = nowInStudioTZ();
  if (booking.date < now.date || (booking.date === now.date && start <= now.minutes)) {
    return "Horário já passou. Recuse ou combine outro atendimento com o cliente.";
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Painel administrativo                                                      */
/* -------------------------------------------------------------------------- */

export async function getAdminBookings(): Promise<Booking[]> {
  if (!(await staffScope()).allowed) return [];
  const supabase = await adminDb();
  if (!supabase) return demoStore.bookings;

  const scope = await staffScope();

  let query = supabase.from("bookings").select("*");
  // Profissional lê APENAS o próprio escopo; admin lê tudo; qualquer
  // combinação fora disso não recebe lista alguma.
  if (!scope.allowed) return [];
  if (!scope.admin) {
    query = query.eq("professional_id", scope.professionalId ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });

  // Com banco configurado não há substituição por demonstração: erro
  // responde vazio (e é registrado), nunca dados fictícios.
  if (error || !data) {
    if (error) console.error("getAdminBookings:", error.message);
    return [];
  }
  return (data as Row[]).map(bookingFromRow);
}

/**
 * Reserva por código (o código é o único dado no link de gestão — dados
 * pessoais e credenciais não entram na URL).
 */
export async function getBookingByCode(code: string): Promise<Booking | null> {
  if (!code || code.length > 80 || !(await getAdminSession())) return null;

  const supabase = await adminDb();
  if (!supabase) {
    return demoStore.bookings.find((b) => b.code === code) ?? null;
  }

  const { data: row } = await supabase
    .from("bookings")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  return row ? bookingFromRow(row) : null;
}

export async function getAdminClients(): Promise<Client[]> {
  const session = await getAdminSession();

  if (!session) return [];

  if (session.role === "professional") {
    if (!session.professionalId) return [];

    const bookings = (await getAdminBookings())
      .filter((booking) => booking.professionalId === session.professionalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const clientsByPhone = new Map<string, Client>();

    for (const booking of bookings) {
      const phone = booking.clientPhone.replace(/\D/g, "");
      const key = phone || booking.id;
      let client = clientsByPhone.get(key);

      if (!client) {
        client = {
          id: key,
          name: booking.clientName,
          phone: booking.clientPhone,
          email: booking.clientEmail,
          notes: null,
          totalBookings: 0,
          totalSpentCents: 0,
          lastBookingAt: booking.createdAt,
          createdAt: booking.createdAt,
        };

        clientsByPhone.set(key, client);
      }

      client.totalBookings += 1;

      if (
        booking.status === "confirmed" ||
        booking.status === "completed"
      ) {
        client.totalSpentCents += booking.priceCents;
      }

      if (booking.createdAt < client.createdAt) {
        client.createdAt = booking.createdAt;
      }
    }

    return [...clientsByPhone.values()];
  }

  if (session.role !== "admin") return [];
  const supabase = await adminDb();
  if (!supabase) return demoStore.clients;

  // Relação completa de clientes é dado do estúdio: só administrador.
  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("getAdminClients:", error.message);
    return [];
  }

  const clients = (data as Row[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    phone: String(row.client_phone ?? row.phone ?? ""),
    email: row.email ? String(row.email) : null,
    notes: row.notes ? String(row.notes) : null,
    totalBookings: 0,
    totalSpentCents: 0,
    lastBookingAt: null as string | null,
    createdAt: String(row.created_at),
  }));

  const { data: bookings } = await supabase.from("bookings").select("*");

  return clients.map((client) => {
    const own = (bookings as Row[] | null)?.filter(
      (b) => String(b.client_id) === client.id || b.client_phone === client.phone,
    );
    const totalBookings = own?.length ?? 0;
    const totalSpentCents = (own ?? []).reduce(
      (sum, b) => sum + (b.status === "cancelled" ? 0 : Number(b.price_cents ?? 0)),
      0,
    );
    const lastBookingAt =
      own && own.length > 0
        ? own
          .map((b) => String(b.created_at))
          .sort()
          .at(-1) ?? null
        : null;

    return { ...client, totalBookings, totalSpentCents, lastBookingAt };
  });
}

export async function getAdminOrders(): Promise<Order[]> {
  if (!(await staffScope()).admin) return [];
  const supabase = await adminDb();
  if (!supabase) return demoStore.orders;

  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("getAdminOrders:", error.message);
    return [];
  }

  const { data: items } = await supabase.from("order_items").select("*");

  return (data as Row[]).map((row) =>
    toOrder(
      row,
      (items as Row[] | null)?.filter((i) => String(i.order_id) === String(row.id)) ?? [],
    ),
  );
}

export async function getAdminProducts(): Promise<Product[]> {
  if (!(await staffScope()).admin) return [];
  const supabase = await adminDb();
  if (!supabase) return demoStore.products;

  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase.from("products").select("*").order("name");

  if (error || !data) {
    if (error) console.error("getAdminProducts:", error.message);
    return [];
  }
  return (data as Row[]).map(toProduct);
}

export async function getAdminServices(): Promise<Service[]> {
  if (!(await staffScope()).admin) return [];
  const supabase = await adminDb();
  if (!supabase) return demoServices;

  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) {
    if (error) console.error("getAdminServices:", error.message);
    return [];
  }
  return (data as Row[]).map(toService);
}

export async function getAdminProfessionals(): Promise<Professional[]> {
  if (!(await staffScope()).admin) return [];
  const supabase = await adminDb();
  if (!supabase) return demoProfessionals;

  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) {
    if (error) console.error("getAdminProfessionals:", error.message);
    return [];
  }
  return (data as Row[]).map(toProfessional);
}

export async function getStockMovements(): Promise<StockMovement[]> {
  if (!(await staffScope()).admin) return [];
  const supabase = await adminDb();
  if (!supabase) return demoStore.stockMovements;

  if (!(await staffScope()).admin) return [];

  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    if (error) console.error("getStockMovements:", error.message);
    return [];
  }

  const products = await getAdminProducts();
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return (data as Row[]).map((row) => ({
    id: String(row.id),
    productId: String(row.product_id ?? ""),
    productName: nameById.get(String(row.product_id ?? "")) ?? "Produto removido",
    type: (row.type as StockMovement["type"]) ?? "adjust",
    quantity: Number(row.quantity ?? 0),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  }));
}

export async function getDashboardReport(): Promise<DashboardReport> {
  const session = await getAdminSession();

  if (!session || session.role !== "admin") {
    throw new Error("Acesso restrito ao administrador.");
  }

  const bookings = await getAdminBookings();
  const orders = await getAdminOrders();
  const clients = await getAdminClients();

  const validBookings = bookings.filter((b) => b.status !== "cancelled");
  const validOrders = orders.filter((o) => o.status !== "cancelled");

  const bookingRevenue = validBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.priceCents, 0);
  const orderRevenue = validOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const revenueCents = bookingRevenue + orderRevenue;

  const serviceCount = new Map<string, { total: number; revenueCents: number }>();
  for (const booking of validBookings) {
    const entry = serviceCount.get(booking.serviceName) ?? { total: 0, revenueCents: 0 };
    entry.total += 1;
    entry.revenueCents += booking.priceCents;
    serviceCount.set(booking.serviceName, entry);
  }

  const productCount = new Map<string, { total: number; revenueCents: number }>();
  for (const order of validOrders) {
    for (const item of order.items) {
      const entry = productCount.get(item.productName) ?? { total: 0, revenueCents: 0 };
      entry.total += item.quantity;
      entry.revenueCents += item.unitPriceCents * item.quantity;
      productCount.set(item.productName, entry);
    }
  }

  const dailyMap = new Map<string, number>();
  for (const booking of validBookings) {
    dailyMap.set(booking.date, (dailyMap.get(booking.date) ?? 0) + booking.priceCents);
  }
  for (const order of validOrders) {
    const day = order.createdAt.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + order.totalCents);
  }

  const topServices = [...serviceCount.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  const topProducts = [...productCount.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  const dailyRevenue = [...dailyMap.entries()]
    .map(([date, value]) => ({ date, revenueCents: value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const totalTransactions = validBookings.length + validOrders.length;

  return {
    revenueCents,
    bookingsTotal: bookings.length,
    bookingsConfirmed: bookings.filter((b) => b.status === "confirmed").length,
    bookingsPending: bookings.filter((b) => b.status === "pending").length,
    ordersTotal: orders.length,
    ordersRevenueCents: orderRevenue,
    averageTicketCents: totalTransactions > 0 ? Math.round(revenueCents / totalTransactions) : 0,
    newClients: clients.filter(
      (c) => Date.now() - new Date(c.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000,
    ).length,
    topServices,
    topProducts,
    dailyRevenue,
  };
}
