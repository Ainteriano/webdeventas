import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { SiteFooter } from "@/components/storefront/site-footer";
import { getCategorias, getConfiguracion, getSubcategorias } from "@/lib/data";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, categorias, subcategorias] = await Promise.all([
    getConfiguracion(),
    getCategorias(),
    getSubcategorias(),
  ]);
  const nombre = config?.nombre_negocio || "American Shoes";

  const navCategorias = categorias.map((c) => ({
    ...c,
    subcategorias: subcategorias.filter((s) => s.categoria_id === c.id),
  }));

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <SiteHeader
          nombreNegocio={nombre}
          logoUrl={config?.logo_url}
          categorias={navCategorias}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter config={config} />
      </div>
      <WhatsAppButton
        phone={config?.whatsapp || ""}
        message={config?.mensaje_whatsapp || ""}
      />
    </>
  );
}
