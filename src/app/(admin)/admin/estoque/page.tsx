import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StockManager } from "@/components/admin/stock-manager";
import { getAdminSession } from "@/lib/auth";
import { getAdminProducts, getStockMovements } from "@/lib/data";

export default async function AdminStockPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/agendamentos");
  }

  const [products, movements] = await Promise.all([
    getAdminProducts(),
    getStockMovements(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Estoque"
        description="Entradas, saídas e ajustes de estoque. A baixa automática acontece ao confirmar um pedido."
      />

      <div className="mt-8">
        <StockManager products={products} movements={movements} />
      </div>
    </div>
  );
}