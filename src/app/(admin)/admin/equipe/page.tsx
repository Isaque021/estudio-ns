import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamManager } from "@/components/admin/team-manager";
import { getAdminProfessionals } from "@/lib/data";

export default async function AdminTeamPage() {
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
