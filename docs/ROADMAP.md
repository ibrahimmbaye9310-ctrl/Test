# Plan de développement

| Phase | Contenu | État |
|---|---|---|
| 1 | Structure, design system, layout, page d'accueil, pages publiques et légales | ✅ |
| 2 | Moteur de recherche complet (filtres, rayon, tri, pagination), page offre détaillée | ✅ |
| 3 | Supabase Auth (inscription, connexion, mot de passe oublié), espace candidat (profil, CV, favoris, candidatures) | ⏳ |
| 4 | Espace recruteur : entreprise, CRUD d'offres, gestion des candidatures, CV, statistiques | ⏳ |
| 5 | Migrations SQL, RLS, triggers, validation serveur, limitation de débit, contrôle des fichiers | ⏳ |
| 6 | Back-office administrateur : statistiques, modération, utilisateurs, signalements | ⏳ |
| 7 | Stripe : Checkout, abonnements, unité, portail client, webhooks, limites par formule | ⏳ |
| 8 | Resend (7 e-mails), sitemap, robots, JSON-LD JobPosting, métadonnées, performance, RGPD (export/suppression) | ⏳ |
| 9 | Tests (unitaires, E2E Playwright, RLS), audit, checklist de mise en production | ⏳ |

Note : la phase 5 (schéma SQL) sera amorcée dès la phase 3, puisque l'authentification et l'espace candidat ont besoin des tables `profiles`, `applications` et `saved_jobs`. La phase 5 complète et durcit l'ensemble.
