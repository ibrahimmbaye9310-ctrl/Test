# Déploiement sur Vercel

Durée : environ 45 minutes la première fois. Ordre conseillé : domaine → Vercel → Resend → Supabase → Stripe → vérifications.

## 0. Prérequis
- Le dépôt GitHub `ibrahimmbaye9310-ctrl/Test` (branche de production : voir étape 2).
- Un **nom de domaine** (ex. `kairo.fr`) : OVH, Gandi, Cloudflare… ou acheté directement dans Vercel.
- Les comptes Supabase (projet **Jobfinder**, `eu-west-1`), Stripe et Resend déjà utilisés en test.

## 1. Générer le secret de limitation
Une chaîne aléatoire d'au moins 32 caractères (générateur de mots de passe, ou `openssl rand -hex 32`).
Elle sert de `RATE_LIMIT_SECRET` ; ne la réutilisez nulle part ailleurs.

## 2. Créer le projet Vercel
1. [vercel.com/new](https://vercel.com/new) → *Import Git Repository* → `Test`. Framework détecté : **Next.js**.
2. *Settings → Git → Production Branch* : la branche qui porte le code (`main` une fois fusionnée).
3. La région des fonctions est fixée à **Dublin (`dub1`)** par `vercel.json` (au plus près de la base Supabase en Irlande).

## 3. Variables d'environnement (Vercel → Settings → Environment Variables → *Production*)
| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.fr` (sans `/` final) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ntfzctzimthfrcnllalc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | clé `sb_secret_…` (**secrète**) |
| `RATE_LIMIT_SECRET` | secret de l'étape 1 |
| `STRIPE_SECRET_KEY` | `sk_live_…` (ou `sk_test_…` pour une préproduction) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (étape 6) |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_SINGLE_OFFER` | sortie de `scripts/stripe-setup.mjs` |
| `STRIPE_AUTOMATIC_TAX` | `true` une fois Stripe Tax configuré, sinon `false` |
| `RESEND_API_KEY` | clé Resend *Sending access* limitée au domaine |
| `EMAIL_FROM` | `Kairo <notifications@votre-domaine.fr>` |

**Ne définissez pas** `EMAIL_REDIRECT_TO`, `BILLING_KEY` ni `NEXT_PUBLIC_ENABLE_DEMO_DATA` en production.
Au démarrage, le serveur journalise `[config] configuration complète` ou la liste de ce qui manque (*Vercel → Logs*).

## 4. Domaine
Vercel → *Settings → Domains* → ajoutez `votre-domaine.fr` et `www.votre-domaine.fr` (redirection vers l'un des deux),
puis créez chez votre registrar les enregistrements DNS affichés. HTTPS est automatique.

## 5. E-mails (Resend + Supabase)
Suivez [`docs/EMAILS.md`](EMAILS.md) : domaine vérifié dans Resend (SPF, DKIM, DMARC), clé d'envoi, SMTP de Supabase,
modèles `supabase/templates/*.html` à coller dans Supabase.

## 6. Supabase
- *Authentication → URL Configuration* : **Site URL** = `https://votre-domaine.fr` ;
  **Redirect URLs** : `https://votre-domaine.fr/auth/confirm`.
- *Authentication → Sign In / Providers* : **Confirm email** activé, mot de passe de 10 caractères minimum.
- *Database → Extensions* : vérifier que **pg_cron** est actif (purge RGPD quotidienne, planifiée par la migration 3).

## 7. Stripe (production)
Suivez [`docs/STRIPE.md`](STRIPE.md) : activation du compte, `node scripts/stripe-setup.mjs` avec la clé **live**,
webhook `https://votre-domaine.fr/api/stripe/webhook` (6 événements), Stripe Tax, e-mails de reçus.

## 8. Vérifications après déploiement (15 minutes)
1. `https://votre-domaine.fr` s'affiche ; `/robots.txt` et `/sitemap.xml` répondent.
2. Inscription candidat avec une vraie adresse → e-mail de confirmation reçu (expéditeur = votre domaine).
3. Profil + CV, puis recherche d'offres.
4. Inscription recruteur → entreprise → *Abonnement* → paiement réel de la plus petite formule
   (ou en mode test sur une préproduction) → formule active en quelques secondes ; Stripe → *Webhooks* : événements en 200.
5. Publication d'une offre → visible dans la recherche → candidature depuis le compte candidat → 2 e-mails reçus.
6. Changement de statut → e-mail au candidat.
7. Compte administrateur (voir `docs/SUPABASE.md`) → `/admin` affiche les indicateurs.
8. Supprimez ensuite les comptes et données de test créés pendant cette vérification (et remboursez le paiement
   depuis Stripe si besoin).
