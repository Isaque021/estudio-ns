import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ServicesManager } from "@/components/admin/services-manager";
import { getAdminServices } from "@/lib/data";

export default async function AdminServicesPage() {
  const services = await getAdminServices();

  return (
    <div>
      <AdminPageHeader
        title="Serviços"
        description="Preços, duração e disponibilidade dos serviços exibidos no site."
      />

      <div className="mt-8">
        <ServicesManager services={services} />
      </div>
    </div>
  );
}
