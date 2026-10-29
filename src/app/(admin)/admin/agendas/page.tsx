import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AgendasManager } from "@/components/admin/agendas-manager";
import {
  getAdminProfessionals,
  getProfessionals,
  getBusinessHours,
  getScheduleData,
} from "@/lib/data";

export const metadata = { title: "Agendas · Painel" };

export default async function AdminAgendasPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const [availableProfessionals, businessHours, schedule] = await Promise.all([
    session.role === "admin" ? getAdminProfessionals() : getProfessionals(),
    getBusinessHours(),
    getScheduleData(),
  ]);

  const professionals = session.role === "admin"
    ? availableProfessionals
    : availableProfessionals.filter((professional) => professional.id === session.professionalId);

  // Expediente semanal resolvido por profissional (hoje: padrão do estúdio,
  // com sobreposição individual quando existir). Exceções pontuais ficam
  // listadas dentro do card.
  const weekly = new Map<string, string[]>();
  for (const professional of professionals) {
    weekly.set(
      professional.id,
      Array.from({ length: 7 }, (_, weekday) => {
        const overlay = schedule.hours.find(
          (hour) => hour.professionalId === professional.id && hour.weekday === weekday,
        );
        const base = overlay ?? businessHours.find((hour) => hour.weekday === weekday);
        if (!base || base.closed) return "Fechado";
        return `${base.opensAt ?? "–"} às ${base.closesAt ?? "–"}`;
      }),
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Agendas"
        description="Expediente individual de cada profissional, ajustes por dia e o prazo das solicitações do site."
      />
      <div className="mt-8">
        <AgendasManager
          professionals={professionals.filter((p) => p.active)}
          weekly={weekly}
          exceptions={schedule.exceptions}
          holdMinutes={schedule.settings.holdMinutes}
          canEditSettings={session.role === "admin"}
        />
      </div>
    </div>
  );
}
