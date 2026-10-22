import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BookingsTable } from "@/components/admin/bookings-table";
import { getAdminBookings } from "@/lib/data";

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookings();

  return (
    <div>
      <AdminPageHeader
        title="Agendamentos"
        description="Reservas recebidas pelo site. Confirme, conclua ou cancele — o cliente é notificado pelo WhatsApp."
      />

      <div className="mt-8">
        <BookingsTable bookings={bookings} />
      </div>
    </div>
  );
}
