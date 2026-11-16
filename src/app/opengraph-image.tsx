import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage (réseaux sociaux, messageries), générée au build. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0e1a36", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#ffffff" />
            <path d="M11 8.5v15M20.5 8.5l-8 7.6M15.2 14.1l4.9 5.1" fill="none" stroke="#0e1a36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="22.6" cy="22.6" r="2.6" fill="#3460ff" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Kairo</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Le bon job,</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, color: "#8eaaff" }}>au bon moment.</div>
        </div>
        <div style={{ fontSize: 30, color: "#c6cfe2" }}>CDI · CDD · alternance · temps partiel · jobs étudiants — Île-de-France</div>
      </div>
    ),
    size,
  );
}
