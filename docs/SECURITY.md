# Sécurité et RGPD — mesures en place

| Menace / obligation | Mesure | Où |
|---|---|---|
| Accès aux données d'autrui | Row Level Security sur **toutes** les tables ; fonctions SECURITY DEFINER à `search_path` vide | `supabase/migrations/*` — 123 tests `supabase/tests/rls.test.sql` |
| Élévation de privilèges | Rôle `admin` jamais attribuable depuis le site (trigger) ; champs plateforme (mise en avant, vues, dates, statut de modération) verrouillés par trigger | migrations 1 et 2 |
| Saisie malveillante | Validation Zod côté serveur de chaque action ; contraintes SQL en double barrière | `src/lib/validation/*` |
| Fichiers piégés | Taille + type déclaré + **signature binaire** vérifiés avant stockage ; buckets privés, noms aléatoires, URL signées (60 s à 1 h) | `validateUpload`, actions d'upload |
| Force brute, spam | Limitation par empreinte (IP / e-mail / compte hachés et salés) : connexion, inscription, mot de passe oublié, candidature, upload, publication, signalement — en plus des limites de Supabase Auth | `src/lib/security/rate-limit.ts`, `check_rate_limit()` |
| Énumération de comptes | Messages identiques que l'adresse existe ou non (inscription, connexion, mot de passe oublié) | `src/lib/auth/actions.ts` |
| Redirections ouvertes | Paramètre `suite` limité aux chemins internes | `safeNextPath` |
| Sessions | Cookies Supabase rafraîchis par le proxy, jeton vérifié (`getClaims` / `getUser`) à chaque page privée | `src/proxy.ts`, `src/lib/auth/session.ts` |
| XSS, clickjacking | CSP stricte (domaines autorisés : site + Supabase), `X-Frame-Options: DENY`, `frame-ancestors 'none'`, JSON-LD échappé | `next.config.ts` |
| Données bancaires | Jamais stockées : uniquement des références Stripe ; tables `subscriptions` / `payments` en lecture seule côté client | migration 3 |
| Contenus frauduleux | Validation des offres des entreprises non vérifiées ; signalements ; suspension de compte (offres retirées, connexion refusée) | `/admin` |
| Traçabilité | Journal des actions d'administration, non modifiable ni effaçable | `admin_audit_log` |
| Faux avis | Avis saisis avec date de consentement et certification ; publication manuelle | `testimonials` |
| RGPD — droits | Export JSON des données, suppression définitive du compte et des fichiers | `/espace/compte` |
| RGPD — durées | Purge quotidienne automatique (`run_data_retention()`, pg_cron 3 h 17) | migration 3 |
| Cookies | Uniquement nécessaires (session) → pas de bandeau requis ; documentés dans la politique de confidentialité | `/confidentialite#cookies` |

## Variables sensibles
- `SUPABASE_SECRET_KEY` : serveur uniquement (suppression de compte, webhooks).
- `RATE_LIMIT_SECRET` : sel des empreintes de limitation (32+ caractères aléatoires). **Obligatoire en production.**
- Aucune clé n'est présente dans le dépôt ; `.env.local` est ignoré par Git.
