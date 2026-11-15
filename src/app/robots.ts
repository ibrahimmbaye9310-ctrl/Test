import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  // Hors production (préproduction Vercel) : rien n'est indexé.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/espace", "/recruteur", "/admin", "/api/", "/auth/", "/connexion", "/inscription", "/mot-de-passe", "/compte-supprime", "/compte-suspendu"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
