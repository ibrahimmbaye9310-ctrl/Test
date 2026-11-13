"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Partage natif sur mobile, sinon copie du lien dans le presse-papiers. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* partage annulé : on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez le lien de l'offre :", url);
    }
  }

  return (
    <Button variant="secondary" onClick={share} className="w-full" aria-live="polite">
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copied ? "Lien copié" : "Partager l'offre"}
    </Button>
  );
}
