import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsManager } from "@/components/admin/products-manager";
import { getAdminProducts } from "@/lib/data";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <AdminPageHeader
        title="Produtos"
        description="Catálogo da loja: nomes, preços, SKUs e visibilidade no site."
      />

      <div className="mt-8">
        <ProductsManager products={products} />
      </div>
    </div>
  );
}
