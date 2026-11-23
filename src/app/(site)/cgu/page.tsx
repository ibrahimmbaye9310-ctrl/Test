import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { PLAN_ORDER, PLANS } from "@/lib/config/plans";
import { publisher, publisherComplete, publisherName, siteConfig } from "@/lib/config/site";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation et de vente",
  alternates: { canonical: "/cgu" },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Conditions générales d'utilisation et de vente" />
      <Prose updatedAt="23 novembre 2026" draft={!publisherComplete}>
        <h2>Objet</h2>
        <p>
          Kairo est une plateforme de mise en relation entre candidats et recruteurs, éditée par {publisherName} (voir les{" "}
          <Link href="/mentions-legales">mentions légales</Link>). Les présentes conditions encadrent l&apos;utilisation de
          Kairo par tous les utilisateurs (partie A) et la vente des services payants aux recruteurs (partie B). Créer un
          compte vaut acceptation de ces conditions.
        </p>

        <h2>A. Conditions générales d&apos;utilisation</h2>
        <h3>1. Comptes</h3>
        <p>
          L&apos;inscription est gratuite et réservée aux personnes âgées d&apos;au moins 16 ans. Chaque utilisateur est
          responsable de la confidentialité de ses identifiants et de l&apos;exactitude des informations fournies. Le compte
          peut être supprimé à tout moment depuis l&apos;espace personnel.
        </p>
        <h3>2. Candidats</h3>
        <p>
          L&apos;utilisation de Kairo est entièrement gratuite pour les candidats. Le CV et le profil ne sont transmis
          qu&apos;aux recruteurs des offres auxquelles le candidat a postulé. Kairo n&apos;intervient pas dans la décision de
          recrutement et ne garantit pas l&apos;obtention d&apos;un emploi.
        </p>
        <h3>3. Annonces</h3>
        <p>
          Les recruteurs s&apos;engagent à publier des offres réelles, licites, non discriminatoires et conformes au Code du
          travail, et à ne jamais demander de paiement aux candidats. Kairo peut modérer, suspendre ou supprimer toute annonce
          frauduleuse ou non conforme, et suspendre le compte concerné.
        </p>
        <h3>4. Signalements</h3>
        <p>Tout utilisateur peut signaler une annonce ou un comportement abusif depuis la plateforme.</p>
        <h3>5. Disponibilité et responsabilité</h3>
        <p>
          Kairo agit comme intermédiaire technique : les annonces sont publiées sous la responsabilité des recruteurs. Le
          service est fourni en l&apos;état ; des interruptions ponctuelles (maintenance, incident) peuvent survenir.
        </p>

        <h2>B. Conditions générales de vente (recruteurs)</h2>
        <h3>6. Clients concernés</h3>
        <p>
          Les services payants sont réservés aux recruteurs agissant à titre professionnel (entreprises, associations,
          indépendants), pour leurs besoins de recrutement.
        </p>
        <h3>7. Services et prix</h3>
        <ul>
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            return (
              <li key={id}>
                <strong>{plan.name}</strong> : {formatPrice(plan.priceCents)}
                {plan.interval === "month" ? " par mois" : " par annonce"} — {plan.features.join(", ").toLowerCase()}.
              </li>
            );
          })}
        </ul>
        <p>
          {publisher.siret && publisher.vatExempt
            ? "TVA non applicable, article 293 B du Code général des impôts. "
            : "Les prix sont indiqués hors taxes. "}
          Les prix en vigueur sont ceux affichés sur la page <Link href="/tarifs">Tarifs</Link> au moment de la commande.
          Toute modification de prix d&apos;un abonnement est annoncée au moins 30 jours à l&apos;avance et s&apos;applique au
          renouvellement suivant.
        </p>
        <h3>8. Commande et paiement</h3>
        <p>
          La commande s&apos;effectue depuis l&apos;espace recruteur. Le paiement par carte bancaire est exigible à la
          commande et traité par Stripe ; Kairo n&apos;a jamais accès aux données bancaires. Les abonnements sont renouvelés
          automatiquement chaque mois, à la date anniversaire, par prélèvement sur la carte enregistrée. Les factures sont
          disponibles dans « Gérer mon abonnement ».
        </p>
        <h3>9. Durée et résiliation</h3>
        <p>
          Les abonnements sont sans engagement et résiliables à tout moment depuis « Gérer mon abonnement ». La résiliation
          prend effet à la fin de la période déjà payée ; la période entamée n&apos;est pas remboursée. L&apos;annonce à
          l&apos;unité permet de publier une annonce pendant 30 jours à compter de sa publication.
        </p>
        <p>
          En cas d&apos;échec de paiement, de nouvelles tentatives sont effectuées ; si l&apos;abonnement prend fin, les
          annonces déjà en ligne restent visibles jusqu&apos;à leur expiration, mais aucune nouvelle annonce ne peut être
          publiée au-delà des droits restants.
        </p>
        <h3>10. Absence de droit de rétractation</h3>
        <p>
          Les services étant fournis à des professionnels, le droit de rétractation prévu par le Code de la consommation ne
          s&apos;applique pas.
        </p>
        <h3>11. Modération</h3>
        <p>
          Une annonce supprimée pour non-conformité (article 3) ne donne lieu à aucun remboursement. En cas de fraude avérée,
          le compte peut être suspendu et l&apos;abonnement résilié.
        </p>
        <h3>12. Responsabilité</h3>
        <p>
          Kairo ne garantit ni un nombre de vues ni un nombre de candidatures. Sauf faute lourde ou intentionnelle, la
          responsabilité de l&apos;éditeur est limitée aux sommes versées par le recruteur au cours des 12 derniers mois.
        </p>

        <h2>Contact, droit applicable et litiges</h2>
        <p>
          Pour toute question ou réclamation : <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
          Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
          avant toute action devant les tribunaux compétents.
        </p>
      </Prose>
    </>
  );
}
