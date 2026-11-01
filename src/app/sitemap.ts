import type { MetadataRoute } from "next";
import { getProductos, getCategorias } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [productos, categorias] = await Promise.all([
    getProductos(),
    getCategorias(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ubicacion`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/seguimiento`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const catRoutes = categorias.map((c) => ({
    url: `${base}/catalogo?categoria=${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const prodRoutes = productos.map((p) => ({
    url: `${base}/producto/${p.slug}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...catRoutes, ...prodRoutes];
}
