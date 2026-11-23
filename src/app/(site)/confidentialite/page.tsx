import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { publisherAddress, publisherComplete, publisherName, siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

const rows = [
  ["Compte (nom, e-mail, mot de passe chiffré)", "Gestion du compte", "Exécution du contrat (CGU)", "Durée du compte, puis suppression"],
  ["Profil candidat (CV, compétences, disponibilités, photo facultative)", "Candidater aux offres", "Exécution du contrat", "Durée du compte ; compte inactif supprimé après 2 ans"],
  ["Candidatures", "Transmission au recruteur, suivi du statut", "Exécution du contrat", "2 ans après la dernière action"],
  ["Données entreprise et facturation", "Abonnements, factures", "Contrat et obligation légale", "10 ans (obligations comptables)"],
  ["Notifications dans l'application", "Vous informer de l'avancement des candidatures", "Exécution du contrat", "12 mois"],
  ["Signalements d'annonces", "Modération, lutte contre la fraude", "Intérêt légitime", "Durée du traitement, puis 12 mois"],
  ["Empreintes de limitation (IP et e-mail hachés, non réversibles)", "Prévention des abus (tentatives de connexion…)", "Intérêt légitime", "48 heures"],
  ["Journaux techniques de l'hébergeur", "Sécurité", "Intérêt légitime", "Selon l'hébergeur, 12 mois maximum"],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Politique de confidentialité" description="Comment Kairo collecte, utilise et protège vos données personnelles." />
      <Prose updatedAt="23 novembre 2026" draft={!publisherComplete}>
        <h2>Responsable du traitement</h2>
        <p>
          {publisherName}, éditeur de Kairo, domicilié {publisherAddress}, est responsable du traitement des données
          collectées sur Kairo. Pour toute question ou demande : <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
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
          Les données bancaires sont traitées exclusivement par Stripe et ne sont jamais stockées par Kairo. Certains
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
        <h2 id="cookies">Cookies</h2>
        <p>
          Kairo n&apos;utilise <strong>aucun cookie publicitaire ni de mesure d&apos;audience</strong>. Seuls des éléments
          strictement nécessaires au service sont déposés ; ils sont exemptés de consentement (article 82 de la loi
          Informatique et Libertés), c&apos;est pourquoi aucun bandeau ne vous est présenté :
        </p>
        <ul>
          <li><strong>sb-…-auth-token</strong> (cookie) : maintient votre session de connexion. Supprimé à la déconnexion.</li>
          <li><strong>Stockage local du navigateur</strong> : préférences d&apos;affichage, sans donnée personnelle.</li>
        </ul>
        <p>
          Si des services de mesure d&apos;audience ou marketing étaient ajoutés, un bandeau vous permettrait de les accepter
          ou de les refuser aussi simplement, avant tout dépôt.
        </p>
        <h2>Conservation et suppression automatique</h2>
        <p>
          Une tâche quotidienne applique les durées ci-dessus : expiration des offres échues, effacement des candidatures de
          plus de 24 mois, des notifications de plus de 12 mois et des empreintes de limitation de plus de 48 heures.
        </p>
        <h2>Sécurité</h2>
        <p>
          Connexions chiffrées (HTTPS), mots de passe hachés, cloisonnement des données par utilisateur au niveau de la base
          (Row Level Security), contrôle du contenu réel des fichiers téléversés, liens d&apos;accès aux CV à durée limitée,
          limitation des tentatives abusives et politique de sécurité du contenu (CSP) dans le navigateur.
        </p>
      </Prose>
    </>
  );
}
