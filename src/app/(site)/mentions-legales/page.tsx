import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Prose } from "@/components/layout/prose";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function LegalNoticePage() {
  return (
    <>
      <PageHeader title="Mentions légales" />
      <Prose updatedAt="13 novembre 2026" draft>
        <h2>Éditeur du site</h2>
        <p>
          Le site Kairo est édité par <strong>[Raison sociale]</strong>, [forme juridique] au capital de [montant] €,
          immatriculée au RCS de [ville] sous le numéro [SIREN], dont le siège social est situé [adresse complète].
          <br />
          Numéro de TVA intracommunautaire : [numéro]. Contact : <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
        <p>Directeur·rice de la publication : [Prénom Nom], en qualité de [fonction].</p>
        <h2>Hébergement</h2>
        <p>
          Application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.
          <br />
          Base de données et fichiers : Supabase Inc., hébergement dans une région de l&apos;Union européenne — supabase.com.
        </p>
        <h2>Propriété intellectuelle</h2>
        <p>
          La marque Kairo, le logo, la charte graphique et le code du site sont la propriété de l&apos;éditeur. Toute
          reproduction sans autorisation est interdite. Les annonces restent la propriété des entreprises qui les publient.
        </p>
        <h2>Données géographiques</h2>
        <p>
          La recherche par distance utilise le référentiel des communes d&apos;Etalab et la base officielle des codes postaux de
          La Poste (Licence Ouverte 2.0), ainsi que des coordonnées issues de{" "}
          <a href="https://www.geonames.org" rel="noopener noreferrer" target="_blank">GeoNames</a> (licence CC BY 4.0).
        </p>
        <h2>Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Prose>
    </>
  );
}
