import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ServicesManager } from "@/components/admin/services-manager";
import { getAdminSession } from "@/lib/auth";
import { getAdminServices } from "@/lib/data";

export default async function AdminServicesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/agendamentos");
  }

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