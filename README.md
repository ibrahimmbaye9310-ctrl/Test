# JobFinder

**Le bon job, au bon moment.** Plateforme SaaS de recrutement qui met en relation étudiants, candidats (CDI, CDD, temps partiel) et entreprises, en commençant par l'Île-de-France.

- Architecture : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Plan de développement : [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Prérequis
- Node.js ≥ 20.9 (22 LTS recommandé), npm 10+

## Installation locale
```bash
npm install
cp .env.example .env.local   # compléter au fil des phases
npm run dev                  # http://localhost:3000
```

## Scripts
| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint (règles Next.js + Core Web Vitals) |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run check` | Typage, lint, tests et build (à lancer avant chaque commit) |

## Variables d'environnement
Voir [`.env.example`](.env.example). Aucune clé secrète ne doit être commitée. Les services externes (Supabase, Stripe, Resend) seront configurés aux phases 3, 7 et 8, avec un guide pas à pas.

## Données de démonstration
Tant qu'aucune base n'est branchée, des offres **fictives** illustrent l'interface. Elles portent le badge « Exemple fictif », ne sont pas indexées et on ne peut pas y postuler. En production : `NEXT_PUBLIC_ENABLE_DEMO_DATA=false`.

## Déploiement (Vercel)
1. Importer le dépôt GitHub sur [vercel.com/new](https://vercel.com/new) (framework détecté : Next.js).
2. Renseigner les variables d'environnement de `.env.example` dans *Settings → Environment Variables*.
3. Déployer. Le guide complet (domaine, webhooks Stripe, DNS Resend) sera fourni en phase 9.

## Données géographiques
`src/lib/geo/communes-idf.json` est généré (ne pas modifier à la main). Pour le régénérer : voir l'en-tête de `scripts/build-communes-idf.py` (paquets npm `@etalab/decoupage-administratif`, `codes-postaux`, `all-the-cities` en tant que fichiers de données).
