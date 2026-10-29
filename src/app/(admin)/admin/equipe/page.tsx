import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamManager } from "@/components/admin/team-manager";
import { getAdminSession } from "@/lib/auth";
import { getAdminProfessionals } from "@/lib/data";

export default async function AdminTeamPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/agendamentos");
  }

  const professionals = await getAdminProfessionals();

  return (
    <div>
      <AdminPageHeader
        title="Equipe"
        description="Gerencie os profissionais, funções, bios e especialidades exibidos no agendamento."
      />

      <div className="mt-8">
        <TeamManager professionals={professionals} />
      </div>
    </div>
  );
}