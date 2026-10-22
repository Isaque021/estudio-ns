import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { demoStore } from "@/lib/demo-store";
import {
  demoGallery,
  demoHours,
  demoProfessionals,
  demoServices,
} from "@/lib/demo-data";
import type {
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
  Service,
  StockMovement,
} from "@/lib/types";

/**
 * Camada de dados.
 *
 * Quando o Supabase está configurado, todas as leituras vêm do PostgreSQL.
 * Sem configuração, a aplicação usa a base de demonstração local, garantindo
 * que o site funcione (e possa ser avaliado) antes do deploy do banco.
 */

export const demoMode = !isSupabaseConfigured();

async function db() {
  if (demoMode) return null;
  return createServerClient();
}

async function adminDb() {
  if (demoMode) return null;
  return createAdminClient() ?? createServerClient();
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
    priceCents: Number(row.price_cents ?? 0),
    durationMin: Number(row.duration_min ?? 30),
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

function toBooking(row: Row): Booking {
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

  if (error || !data || data.length === 0) return demoStore.services.filter((s) => s.active);
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

  if (error || !data || data.length === 0) return demoProfessionals.filter((p) => p.active);
  return (data as Row[]).map(toProfessional);
}

export async function getGallery(): Promise<GalleryItem[]> {
  const supabase = await db();
  if (!supabase) return demoGallery;

  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data || data.length === 0) return demoGallery;
  return (data as Row[]).map(toGalleryItem);
}

export async function getBusinessHours(): Promise<BusinessHour[]> {
  const supabase = await db();
  if (!supabase) return demoHours;

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .order("weekday", { ascending: true });

  if (error || !data || data.length === 0) return demoHours;
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

  if (error || !data || data.length === 0) return demoStore.products.filter((p) => p.active);
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

export async function getBookedSlots(professionalId: string, date: string): Promise<string[]> {
  const supabase = await db();
  if (!supabase) {
    return demoStore.bookings
      .filter(
        (b) =>
          b.professionalId === professionalId &&
          b.date === date &&
          (b.status === "pending" || b.status === "confirmed"),
      )
      .map((b) => b.time);
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("scheduled_time, status")
    .eq("professional_id", professionalId)
    .eq("scheduled_date", date)
    .in("status", ["pending", "confirmed"]);

  if (error || !data) return [];
  return (data as Row[]).map((row) => String(row.scheduled_time).slice(0, 5));
}

/* -------------------------------------------------------------------------- */
/*  Painel administrativo                                                      */
/* -------------------------------------------------------------------------- */

export async function getAdminBookings(): Promise<Booking[]> {
  const supabase = await adminDb();
  if (!supabase) return demoStore.bookings;

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });

  if (error || !data) return demoStore.bookings;
  return (data as Row[]).map(toBooking);
}

export async function getAdminClients(): Promise<Client[]> {
  const supabase = await adminDb();
  if (!supabase) return demoStore.clients;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return demoStore.clients;

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
  const supabase = await adminDb();
  if (!supabase) return demoStore.orders;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return demoStore.orders;

  const { data: items } = await supabase.from("order_items").select("*");

  return (data as Row[]).map((row) =>
    toOrder(
      row,
      (items as Row[] | null)?.filter((i) => String(i.order_id) === String(row.id)) ?? [],
    ),
  );
}

export async function getAdminProducts(): Promise<Product[]> {
  const supabase = await adminDb();
  if (!supabase) return demoStore.products;

  const { data, error } = await supabase.from("products").select("*").order("name");

  if (error || !data) return demoStore.products;
  return (data as Row[]).map(toProduct);
}

export async function getAdminServices(): Promise<Service[]> {
  const supabase = await adminDb();
  if (!supabase) return demoServices;

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) return demoServices;
  return (data as Row[]).map(toService);
}

export async function getAdminProfessionals(): Promise<Professional[]> {
  const supabase = await adminDb();
  if (!supabase) return demoProfessionals;

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) return demoProfessionals;
  return (data as Row[]).map(toProfessional);
}

export async function getStockMovements(): Promise<StockMovement[]> {
  const supabase = await adminDb();
  if (!supabase) return demoStore.stockMovements;

  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

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
