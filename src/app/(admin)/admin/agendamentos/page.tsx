import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BookingsTable } from "@/components/admin/bookings-table";
import { getAdminBookings, getBookingSettings } from "@/lib/data";

export default async function AdminBookingsPage() {
  const [bookings, settings] = await Promise.all([getAdminBookings(), getBookingSettings()]);

  return (
    <div>
      <AdminPageHeader
        title="Agendamentos"
        description="Confirme, conclua ou cancele as reservas e converse com o cliente pelo WhatsApp."
      />

      <div className="mt-8">
        <BookingsTable bookings={bookings} holdMinutes={settings.holdMinutes} />
      </div>
    </div>
  );
}
