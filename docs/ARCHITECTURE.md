# JobFinder — Architecture

> « Le bon job, au bon moment. » Plateforme SaaS de recrutement, lancement en Île-de-France.

## 1. Acteurs et rôles

| Rôle | Accès | Monétisation |
|---|---|---|
| **Visiteur** | Recherche, consultation des offres publiées, pages marketing | — |
| **Candidat** (`candidate`) | Profil, CV, favoris, candidatures et suivi, export / suppression RGPD | Gratuit |
| **Recruteur** (`recruiter`) | Entreprise, offres, candidatures reçues, CV des candidats ayant postulé, statistiques, abonnement | Starter / Pro / annonce à l'unité |
| **Administrateur** (`admin`) | Statistiques globales, modération, utilisateurs, entreprises, signalements, abonnements | — |

Le rôle est stocké dans `profiles.role` et **n'est jamais modifiable par l'utilisateur** (colonne protégée par RLS + trigger). L'admin est attribué manuellement en SQL.

## 2. Stack

| Couche | Choix | Raison |
|---|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) | Rendu serveur (SEO des offres), mutations sans API REST à maintenir |
| Langage | TypeScript strict (`noUncheckedIndexedAccess`) | Fiabilité |
| UI | Tailwind CSS v4 + composants maison, Lucide, police Geist | Design system cohérent, aucun template |
| Données / Auth / Fichiers | Supabase (PostgreSQL + RLS, Auth, Storage) | Sécurité au niveau de la base, région UE |
| Paiement | Stripe Checkout + Billing Portal + webhooks | Aucune donnée bancaire chez nous (PCI) |
| E-mails | Resend (templates React) | Délivrabilité, templates versionnés |
| Validation | Zod (côté serveur sur chaque action) | Une seule source de règles |
| Hébergement | Vercel (région `cdg1` Paris) | Proximité utilisateurs, intégration Next |

## 3. Organisation du code

```
src/
├─ app/
│  ├─ (site)/            Pages publiques avec header/footer : accueil, offres, tarifs, légal
│  ├─ (auth)/            Connexion, inscription, mot de passe (écran partagé)
│  ├─ (candidate)/espace/        Tableau de bord candidat          — phase 3
│  ├─ (recruiter)/recruteur/     Espace recruteur                  — phase 4
│  ├─ (admin)/admin/             Back-office                       — phase 6
│  ├─ api/stripe/webhook/        Webhooks Stripe                   — phase 7
│  ├─ sitemap.ts, robots.ts                                        — phase 8
├─ components/
│  ├─ ui/                Primitives : Button, Input, Field, Select, Badge, Card, Logo, Callout…
│  ├─ layout/            Header, footer, PageHeader, Prose
│  ├─ landing/           Sections de la page d'accueil
│  ├─ jobs/              Carte d'offre, barre de recherche, formatage salaire
│  └─ auth/
├─ lib/
│  ├─ config/            site, plans (prix/limites), taxonomy (contrats, horaires, secteurs)
│  ├─ jobs/queries.ts    Accès aux offres (démo → Supabase sans changer les signatures)
│  ├─ supabase/          Clients serveur / navigateur / admin                 — phase 3
│  ├─ stripe/, email/, validation/, rate-limit/                              — phases 5-8
│  └─ demo/              Données FICTIVES, désactivables par variable d'env
└─ types/
supabase/migrations/     Schéma SQL versionné + RLS                          — phase 5
```

Principes : Server Components par défaut, `"use client"` uniquement pour l'interactivité ; toute mutation passe par une Server Action qui (1) vérifie la session, (2) valide avec Zod, (3) s'appuie sur la RLS comme seconde barrière.

## 4. Modèle de données (phase 5)

```
auth.users 1─1 profiles (role, nom, téléphone, ville, avatar_path, cv_path, skills[], availability[], preferences jsonb)
profiles   1─1 companies (recruteur propriétaire : nom, slug, logo, description, siret, vérifiée)
companies  1─n job_offers (titre, slug, description, contrat, temps, horaires[], secteur, étudiant, salaire min/max/période,
                           ville, code postal, lat/lng, statut draft|pending|published|rejected|closed|expired,
                           is_featured, published_at, expires_at, views_count)
job_offers 1─n applications (candidat, message, cv_path figé, statut sent|reviewing|interview|accepted|rejected) UNIQUE(offre, candidat)
profiles   n─n job_offers via saved_jobs
companies  1─1 subscriptions (stripe_customer_id, stripe_subscription_id, plan, statut, période) ; crédits d'annonces à l'unité
companies  1─n payments (stripe_payment_intent/invoice id, montant, statut) — jamais de données de carte
profiles   1─n notifications ; reports (offre signalée, motif, statut de traitement)
```

Index : `job_offers(status, published_at desc)`, recherche plein texte (`tsvector` français), `(postal_code)`, géographique (lat/lng) pour le rayon, `applications(job_offer_id)`, `applications(candidate_id)`.

### Sécurité (RLS)
- Offres : lecture publique **uniquement** si `status = 'published'` ; écriture réservée au propriétaire de l'entreprise.
- Candidatures : visibles par le candidat auteur et par le recruteur propriétaire de l'offre ; seul ce recruteur change le statut.
- CV / photos : bucket privé, URL signées à durée courte, accès recruteur limité aux candidats ayant postulé à ses offres.
- Limite d'annonces actives : vérifiée côté serveur **et** par un trigger PostgreSQL (impossible à contourner depuis le client).
- Admin : fonction `is_admin()` `security definer` utilisée dans les politiques.

## 5. Recherche
- **URL = état** : tous les critères sont dans l'URL (`/offres?q=…&lieu=…&rayon=10&contrat=cdi&contrat=cdd&temps=part_time&etudiant=1&horaire=weekend&secteur=retail&salaire=2000&tri=distance&page=2`), validés par Zod (`lib/jobs/search-params.ts`) ; une valeur invalide est ignorée, jamais une erreur. Les recherches sont partageables et fonctionnent sans JavaScript.
- **Lieu** : `lib/geo/communes.ts` résout une ville, un code postal, un arrondissement (« Paris 11 ») ou un département (« 93 »). Table de 1 228 communes d'Île-de-France générée par `scripts/build-communes-idf.py` (Etalab + La Poste + GeoNames). 57 petits villages sans coordonnées restent trouvables par nom.
- **Rayon** : distance à vol d'oiseau (haversine) entre centres de communes. En base (phase 5) : colonnes `lat`/`lng` + extension `earthdistance` ou PostGIS.
- **Salaire** : comparé en équivalent mensuel brut temps plein (151,67 h/mois ; annuel ÷ 12).
- **Tri** : récentes (par défaut, offres « à la une » de la formule Pro en tête), anciennes, distance. 12 offres par page.
- **SEO** : seules les recherches sans filtres sont indexables (canonical), les combinaisons de filtres sont en `noindex, follow`. JSON-LD `JobPosting` uniquement pour les offres réelles.
- **Extension nationale** : régénérer la table avec toutes les régions (filtre `region` du script) ou passer à l'API Géo de l'État côté serveur.

## 6. Flux de paiement (phase 7)
Checkout Stripe (abonnement ou paiement unique) → webhook signé (`checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`) → mise à jour de `subscriptions` / `payments` avec la clé service role → e-mail Resend. Changement de formule et résiliation via le Customer Portal Stripe. Mode test obligatoire avant la mise en production.

## 7. Données de démonstration
`src/lib/demo/offers.ts` contient des offres **inventées**, marquées `isDemo`, affichées avec le badge « Exemple fictif », non indexables (`noindex`) et impossibles à postuler. `NEXT_PUBLIC_ENABLE_DEMO_DATA=false` les retire totalement — obligatoire en production.
