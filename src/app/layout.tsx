import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { getConfiguracion } from "@/lib/data";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfiguracion();
  const name = config?.nombre_negocio || "Catálogo de Ventas";
  return {
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description: `Compra en línea en ${name}. Catálogo actualizado, envíos y pagos seguros.`,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: name,
      description: `Catálogo de productos de ${name}`,
      type: "website",
      locale: "es_MX",
      images: config?.logo_url ? [{ url: config.logo_url }] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
