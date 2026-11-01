import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const admin = process.env.ADMIN_PATH || "/gestion-privada";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [admin, "/api/", "/carrito", "/checkout"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
