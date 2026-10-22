import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StockManager } from "@/components/admin/stock-manager";
import { getAdminProducts, getStockMovements } from "@/lib/data";

export default async function AdminStockPage() {
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
