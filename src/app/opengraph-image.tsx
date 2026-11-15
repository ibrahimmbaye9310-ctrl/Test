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
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "white", color: "#0e1a36", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800 }}>J</div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>JobFinder</div>
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
