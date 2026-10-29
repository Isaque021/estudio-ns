import {
  demoBookings,
  demoClients,
  demoOrders,
  demoProducts,
  demoProfessionals,
  demoServices,
} from "@/lib/demo-data";
import type {
  Booking,
  Client,
  Order,
  Product,
  Professional,
  ProfessionalHour,
  ScheduleException,
  StockMovement,
} from "@/lib/types";

/**
 * Armazenamento em memória usado apenas no "modo demonstração"
 * (quando o Supabase não está configurado).
 *
 * Permite testar o fluxo completo — agendar, confirmar no painel, finalizar
 * pedidos e baixar estoque — sem banco de dados. Os dados morrem ao
 * reiniciar o servidor.
 */
export const demoStore = {
  bookings: [...demoBookings] as Booking[],
  orders: [...demoOrders] as Order[],
  clients: [...demoClients] as Client[],
  products: [...demoProducts] as Product[],
  services: [...demoServices],
  professionals: [...demoProfessionals] as Professional[],
  stockMovements: [] as StockMovement[],
  /** Prazo de guarda da solicitação pendente (min). */
  settings: { holdMinutes: 30 },
  /** Expediente semanal individual (vazio = padrão do estúdio). */
  professionalHours: [] as ProfessionalHour[],
  /** Exceções de agenda por data (folga, saída cedo, horário extra, bloqueio). */
  scheduleExceptions: [] as ScheduleException[],
  /** Envios já concluídos por chave de idempotência. */
  idempotency: {} as Record<string, Booking>,
};

export function resetDemoStore(): void {
  demoStore.bookings = [...demoBookings];
  demoStore.orders = [...demoOrders];
  demoStore.clients = [...demoClients];
  demoStore.products = [...demoProducts];
  demoStore.services = [...demoServices];
  demoStore.professionals = [...demoProfessionals];
  demoStore.stockMovements = [];
  demoStore.settings = { holdMinutes: 30 };
  demoStore.professionalHours = [];
  demoStore.scheduleExceptions = [];
  demoStore.idempotency = {};
}
