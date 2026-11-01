import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { SiteFooter } from "@/components/storefront/site-footer";
import { getConfiguracion } from "@/lib/data";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfiguracion();
  const nombre = config?.nombre_negocio || "Catálogo de Ventas";

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <SiteHeader nombreNegocio={nombre} logoUrl={config?.logo_url} />
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
