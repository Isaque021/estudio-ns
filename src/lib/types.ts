export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Preço em centavos. Quando não cadastrado, nada é exibido nem cobrado —
   * e o agendamento é bloqueado até o cadastro existir. */
  priceCents: number | null;
  /** Duração em minutos. Sem ela não dá para encaixar o horário na agenda:
   * slots não são oferecidos e a reserva é recusada no servidor. */
  durationMin: number | null;
  category: string;
  imageUrl: string;
  active: boolean;
  position: number;
};

export type Professional = {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  photoUrl: string;
  phone: string;
  specialties: string[];
  active: boolean;
  position: number;
};

export type GalleryItem = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  position: number;
};

export type BusinessHour = {
  weekday: number;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  sku: string;
  category: string;
  imageUrl: string;
  active: boolean;
};

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
  status: BookingStatus;
  notes: string | null;
  priceCents: number;
  createdAt: string;
  /** Duração do atendimento gravada na reserva (min). Serve para conferir
   * sobreposições mesmo se o serviço mudar de duração depois. */
  durationMin?: number;
  /** Chave gerada no navegador: o mesmo envio repetido não cria reserva nova. */
  idempotencyKey?: string | null;
};

/** Expediente semanal individual (sobrepõe o padrão do estúdio por dia). */
export type ProfessionalHour = {
  professionalId: string;
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
};

export const SCHEDULE_EXCEPTION_KINDS = [
  "open-late",
  "close-early",
  "extra-window",
  "block-range",
  "day-off",
] as const;

export type ScheduleExceptionKind = (typeof SCHEDULE_EXCEPTION_KINDS)[number];

/** Ajuste pontual de um dia: entrar mais tarde, sair mais cedo, horário
 * extra, bloqueio de intervalo ou folga do dia inteiro. */
export type ScheduleException = {
  id: string;
  professionalId: string;
  date: string;
  kind: ScheduleExceptionKind;
  startAt: string | null;
  endAt: string | null;
  note: string | null;
  createdAt: string;
};

/** Configuração de solicitações (prazo de guarda do horário). */
export type AgendaSettings = {
  holdMinutes: number;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string;
  address: string | null;
  notes: string | null;
  totalCents: number;
  status: OrderStatus;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  totalBookings: number;
  totalSpentCents: number;
  lastBookingAt: string | null;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type DashboardReport = {
  revenueCents: number;
  bookingsTotal: number;
  bookingsConfirmed: number;
  bookingsPending: number;
  ordersTotal: number;
  ordersRevenueCents: number;
  averageTicketCents: number;
  newClients: number;
  topServices: Array<{ name: string; total: number; revenueCents: number }>;
  topProducts: Array<{ name: string; total: number; revenueCents: number }>;
  dailyRevenue: Array<{ date: string; revenueCents: number }>;
};
