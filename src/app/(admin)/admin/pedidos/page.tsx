import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { getAdminOrders } from "@/lib/data";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <AdminPageHeader
        title="Pedidos"
        description="Pedidos finalizados pelo WhatsApp. O pagamento é sempre presencial, na retirada."
      />

      <div className="mt-8">
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
