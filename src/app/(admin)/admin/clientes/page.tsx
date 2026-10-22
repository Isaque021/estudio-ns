import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ClientsTable } from "@/components/admin/clients-table";
import { getAdminClients } from "@/lib/data";

export default async function AdminClientsPage() {
  const clients = await getAdminClients();

  return (
    <div>
      <AdminPageHeader
        title="Clientes"
        description="Base de clientes da barbearia com histórico de agendamentos e observações da equipe."
      />

      <div className="mt-8">
        <ClientsTable clients={clients} />
      </div>
    </div>
  );
}
