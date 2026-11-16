# Kairo

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
Voir [`.env.example`](.env.example). Aucune clé secrète ne doit être commitée.
- Supabase (base, comptes, fichiers) : [`docs/SUPABASE.md`](docs/SUPABASE.md)
- Stripe et Resend : phases 7 et 8.

## Tests
Voir [`docs/TESTS.md`](docs/TESTS.md) : 58 tests unitaires, 155 vérifications de la base (RLS), 224 vérifications de
bout en bout, audit d'accessibilité (35 pages, 0 violation). L'intégration continue GitHub rejoue l'essentiel à chaque push.

## Documentation
| Guide | Contenu |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture, modèle de données, recherche |
| [`docs/SUPABASE.md`](docs/SUPABASE.md) | Base, migrations, authentification, administrateur |
| [`docs/STRIPE.md`](docs/STRIPE.md) | Formules, paiements, webhook, TVA |
| [`docs/EMAILS.md`](docs/EMAILS.md) | E-mails transactionnels, domaine, SMTP |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Mesures de sécurité et RGPD |
| [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md) | Mise en ligne sur Vercel, pas à pas |
| [`docs/LANCEMENT.md`](docs/LANCEMENT.md) | Liste de vérification avant lancement |

## Données de démonstration
Pour le développement, `NEXT_PUBLIC_ENABLE_DEMO_DATA=true` affiche des offres **fictives** (badge « Exemple fictif », non
indexées, sans candidature possible). Elles sont désactivées par défaut et **toujours** en production Vercel.

## Déploiement
Guide pas à pas : [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md), puis [`docs/LANCEMENT.md`](docs/LANCEMENT.md).

## Données géographiques
`src/lib/geo/communes-idf.json` est généré (ne pas modifier à la main). Pour le régénérer : voir l'en-tête de `scripts/build-communes-idf.py` (paquets npm `@etalab/decoupage-administratif`, `codes-postaux`, `all-the-cities` en tant que fichiers de données).
