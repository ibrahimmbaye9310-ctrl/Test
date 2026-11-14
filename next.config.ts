import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "https://*.supabase.co";

/**
 * Politique de sécurité du contenu : seuls le site et Supabase peuvent fournir scripts, images et connexions.
 * 'unsafe-inline' reste nécessaire aux scripts d'hydratation de Next.js (pas de données utilisateur injectées).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabase.replace("https://", "wss://")}`,
  "frame-ancestors 'none'",
  // Redirections vers les pages de paiement et de gestion hébergées par Stripe.
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // CV (4 Mo max) et photos transitent par une Server Action qui vérifie leur contenu réel.
    // Vercel limite de toute façon le corps d'une requête à 4,5 Mo.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Logos d'entreprise et photos de profil stockés dans Supabase Storage (phase 3+).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
