import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { escapeHtml, templates } from "@/lib/email/templates";

const url = "https://jobfinder.fr/espace/candidatures";

describe("modèles d'e-mails", () => {
  it("échappe tout contenu saisi par les utilisateurs", () => {
    const e = templates.applicationReceived({ recruiterName: "Ana", candidateName: '<script>alert("x")</script>', offerTitle: "Vendeur & <b>caissier</b>", url });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("Vendeur &amp; &lt;b&gt;caissier&lt;/b&gt;");
    expect(escapeHtml(`"'&<>`)).toBe("&quot;&#39;&amp;&lt;&gt;");
  });
  it("produit pour chaque e-mail un sujet, une version HTML et une version texte avec le lien", () => {
    const all = [
      templates.applicationConfirmation({ candidateName: "Lina", offerTitle: "Serveur", companyName: "Brasserie", url }),
      templates.applicationReceived({ recruiterName: "Rémi", candidateName: "Lina", offerTitle: "Serveur", url }),
      templates.applicationStatus({ candidateName: "Lina", offerTitle: "Serveur", companyName: "Brasserie", status: "interview", url }),
      templates.subscriptionActivated({ name: "Rémi", plan: "Pro", limit: 10, url }),
      templates.singleOfferPurchased({ name: "Rémi", url }),
      templates.subscriptionRenewed({ name: "Rémi", plan: "Starter", amount: "29 €", url }),
      templates.paymentFailed({ name: "Rémi", amount: "59 €", url }),
      templates.subscriptionEnded({ name: "Rémi", url }),
    ];
    for (const e of all) {
      expect(e.subject.length).toBeGreaterThan(5);
      expect(e.html).toContain('lang="fr"');
      expect(e.html).toContain(url);
      expect(e.text).toContain(url);
      expect(e.text).not.toContain("<");
    }
  });
  it("adapte le message au statut de la candidature", () => {
    expect(templates.applicationStatus({ candidateName: "L", offerTitle: "X", companyName: "Y", status: "accepted", url }).subject).toContain("Acceptée");
    expect(templates.applicationStatus({ candidateName: "L", offerTitle: "X", companyName: "Y", status: "rejected", url }).html).toContain("pas retenu");
  });
  it("conserve la variable Supabase {{ .ConfirmationURL }} sans l'échapper", () => {
    const e = templates.authConfirmSignup();
    expect(e.html).toContain('href="{{ .ConfirmationURL }}"');
  });

  // Les modèles Supabase (à coller dans le Dashboard) sont générés depuis le même code : ils restent synchronisés.
  it("modèles Supabase Auth à jour dans supabase/templates/", () => {
    const files = { "confirm-signup.html": templates.authConfirmSignup().html, "reset-password.html": templates.authResetPassword().html };
    for (const [name, html] of Object.entries(files)) {
      const file = path.resolve(__dirname, "../../supabase/templates", name);
      if (process.env.UPDATE_TEMPLATES || !existsSync(file)) writeFileSync(file, html);
      expect(readFileSync(file, "utf8"), `${name} obsolète : relancez avec UPDATE_TEMPLATES=1`).toBe(html);
    }
  });
});
