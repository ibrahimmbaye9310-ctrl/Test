# Tests

| Niveau | Commande | Contenu | Résultat (15/11/2026) |
|---|---|---|---|
| Typage + lint | `npm run typecheck && npm run lint` | TypeScript strict, ESLint (Next.js, Core Web Vitals) | ✅ 0 erreur |
| Unitaires | `npm test` | Recherche, géographie, validation, fichiers, SEO, e-mails, facturation | ✅ 58 tests |
| Base de données | `npm run test:rls` (PostgreSQL local, variables `PG*`) | 6 migrations + règles d'accès de chaque rôle | ✅ 155 vérifications |
| Bout en bout | `npm run test:e2e` (serveur local + Supabase/Stripe/Resend de test) | Parcours réels dans un navigateur | ✅ 224 vérifications |
| Accessibilité | `npm run audit:a11y` | axe-core, WCAG 2.1 A/AA | ✅ 35 pages, 0 violation |
| Performance | Lighthouse (manuel) | Ordinateur / mobile 4G simulée | Perf. 95–98 / 86–96 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100* |
| Dépendances | `npm audit --omit=dev` | Vulnérabilités connues | ✅ 0 |

\* Hors pages volontairement exclues de l'indexation (connexion, offres de démonstration).

L'intégration continue (`.github/workflows/ci.yml`) rejoue automatiquement typage, lint, tests unitaires, build et
tests de la base à chaque push.

## Scénarios de bout en bout (`tests/e2e/`)
| Fichier | Vérifications | Parcours |
|---|---|---|
| `03-candidat.cjs` | 54 | Inscription, connexion, profil, CV (faux PDF refusé), candidature, favoris, statut, isolation, export RGPD |
| `04-recruteur.cjs` | 45 | Entreprise, logo, offre (brouillon, publication, modification, fermeture, suppression), candidatures, CV, statistiques, isolation |
| `05-securite.cjs` | 24 | Notifications, signalements, force brute, CSP, tables protégées |
| `06-admin.cjs` | 50 | Modération, vérification d'entreprise, signalements, suspension, avis, journal |
| `07-paiements.cjs` | 39 | Webhook signé, Checkout, abonnement réel, limites, annonce à l'unité, Pro, échec, portail, résiliation |
| `08-emails.cjs` | 12 | Les 8 e-mails transactionnels envoyés via Resend |

Prérequis et lancement : en-tête de `tests/e2e/run-all.sh`. Comptes créés : `e2e.*@example.com` (à supprimer avec
`delete from auth.users where email like 'e2e.%@example.com';`).

## Bugs trouvés par les tests et corrigés avant mise en ligne (extrait)
- Sécurité : un recruteur pouvait se déclarer « vérifié » ; vérification de l'appelant toujours vraie dans une fonction
  `SECURITY DEFINER` ; fausse clé de facturation acceptée sans empreinte configurée.
- Données : formulaires vidés après une erreur (React 19) ; doublons de compétences ; événement Stripe perdu en cas d'échec.
- Accessibilité : contrastes insuffisants (4 couleurs), structure de liste invalide, ordre des titres.
