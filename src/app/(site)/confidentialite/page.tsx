import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

const rows = [
  ["Compte (nom, e-mail, mot de passe chiffré)", "Gestion du compte", "Exécution du contrat (CGU)", "Durée du compte, puis suppression"],
  ["Profil candidat (CV, compétences, disponibilités, photo facultative)", "Candidater aux offres", "Exécution du contrat", "Durée du compte ; compte inactif supprimé après 2 ans"],
  ["Candidatures", "Transmission au recruteur, suivi du statut", "Exécution du contrat", "2 ans après la dernière action"],
  ["Données entreprise et facturation", "Abonnements, factures", "Contrat et obligation légale", "10 ans (obligations comptables)"],
  ["Journaux techniques (IP, horodatage)", "Sécurité, prévention des abus", "Intérêt légitime", "12 mois maximum"],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Politique de confidentialité" description="Comment JobFinder collecte, utilise et protège vos données personnelles." />
      <Prose updatedAt="13 novembre 2026" draft>
        <h2>Responsable du traitement</h2>
        <p>
          [Raison sociale], [adresse], est responsable du traitement des données collectées sur JobFinder. Pour toute
          question ou demande : <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
        <h2>Données traitées, finalités et durées</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Données</th><th>Finalité</th><th>Base légale</th><th>Conservation</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Destinataires</h2>
        <ul>
          <li>Les recruteurs, uniquement pour les offres auxquelles vous avez postulé. Votre CV n&apos;est jamais public.</li>
          <li>Nos sous-traitants techniques : Vercel (hébergement), Supabase (base de données, authentification, fichiers), Stripe (paiements des recruteurs), Resend (e-mails transactionnels).</li>
        </ul>
        <p>
          Les données bancaires sont traitées exclusivement par Stripe et ne sont jamais stockées par JobFinder. Certains
          sous-traitants étant établis aux États-Unis, les transferts sont encadrés par les clauses contractuelles types de la
          Commission européenne et/ou le Data Privacy Framework.
        </p>
        <h2>Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
          portabilité. Depuis votre espace, vous pouvez à tout moment exporter vos données ou supprimer votre compte. Vous
          pouvez aussi nous écrire à l&apos;adresse ci-dessus ; nous répondons sous un mois.
        </p>
        <p>
          Vous pouvez introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">cnil.fr</a>).
        </p>
        <h2>Cookies</h2>
        <p>
          JobFinder utilise uniquement des cookies strictement nécessaires (session de connexion, sécurité), exemptés de
          consentement. Si des cookies de mesure d&apos;audience ou marketing étaient ajoutés, un bandeau de consentement vous
          permettrait de les accepter ou de les refuser aussi simplement.
        </p>
        <h2>Sécurité</h2>
        <p>
          Connexions chiffrées (HTTPS), mots de passe hachés, cloisonnement des données par utilisateur au niveau de la base
          (Row Level Security), contrôle des fichiers téléversés et limitation des tentatives abusives.
        </p>
      </Prose>
    </>
  );
}
