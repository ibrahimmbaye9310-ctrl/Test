# Configuration de Supabase

Projet : **Jobfinder** — région **West EU (Ireland) `eu-west-1`** (Union européenne).

## 1. Créer le schéma de la base (une seule fois)
1. Dashboard Supabase → **SQL Editor** → **New query**.
2. Copiez **tout** le contenu de [`supabase/migrations/20261113000001_core_schema.sql`](../supabase/migrations/20261113000001_core_schema.sql), collez, puis **Run**.
3. Résultat attendu : `Success. No rows returned`. Vérifiez dans **Table Editor** : `profiles`, `companies`, `job_offers`, `applications`, `saved_jobs` ; dans **Storage** : buckets `avatars` et `cvs` (privés).

Puis, de la même façon et dans l'ordre :
| Fichier | Contenu | État |
|---|---|---|
| `20261113000001_core_schema.sql` | Profils, entreprises, offres, candidatures, favoris, CV et photos | installé |
| `20261114000002_recruiter_space.sql` | Logos (bucket public), règles de publication, statistiques de vues | installé |
| `20261115000003_security_notifications.sql` | Notifications, signalements, abonnements, paiements, limitation, purge RGPD | installé |
| `20261115000004_admin.sql` | Modération, suspension, vérification des entreprises, avis, journal d'administration | installé |

> Les migrations des phases suivantes se lancent de la même façon, dans l'ordre de leur nom de fichier. Elles sont ré-exécutables.
> Elles sont testées avant livraison sur un PostgreSQL local : `PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run.sh`.

## 2. Variables d'environnement
Dashboard → **Project Settings → API Keys**.

| Variable | Valeur | Secret ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-id>.supabase.co` (page d'accueil du projet) | Non |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé **Publishable** (`sb_publishable_…`) ou ancienne clé `anon` | Non (protégée par la RLS) |
| `SUPABASE_SECRET_KEY` | Clé **Secret** (`sb_secret_…`) ou ancienne clé `service_role` | **OUI** : serveur uniquement |

À renseigner dans `.env.local` (développement) et dans Vercel → *Settings → Environment Variables* (production).

## 3. Authentification
Dashboard → **Authentication**.

**URL Configuration**
- *Site URL* : l'adresse du site (`http://localhost:3000` en local, puis votre domaine, ex. `https://jobfinder.fr`).
- *Redirect URLs* : ajoutez `http://localhost:3000/auth/confirm` et `https://<votre-domaine>/auth/confirm`
  (et l'URL Vercel de production si vous l'utilisez).

**Sign In / Providers → Email**
- *Confirm email* : **activé** (obligatoire : pas de compte sans adresse vérifiée).
- *Secure email change* : activé.
- *Minimum password length* : **10** ; *Password requirements* : lettres et chiffres.

**Emails → Templates** (versions françaises — remplacez sujet et contenu)

*Confirm signup* — sujet : `Confirmez votre adresse e-mail — JobFinder`
```html
<h2>Bienvenue sur JobFinder</h2>
<p>Pour activer votre compte, confirmez votre adresse e-mail :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon adresse</a></p>
<p>Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>
<p>— L'équipe JobFinder · Le bon job, au bon moment.</p>
```

*Reset password* — sujet : `Réinitialisation de votre mot de passe — JobFinder`
```html
<h2>Mot de passe oublié ?</h2>
<p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Il est valable 1 heure.</p>
<p><a href="{{ .ConfirmationURL }}">Choisir un nouveau mot de passe</a></p>
<p>Si vous n'avez rien demandé, ignorez ce message : votre mot de passe reste inchangé.</p>
<p>— L'équipe JobFinder</p>
```

> ⚠️ **Envoi des e-mails** : le service d'e-mail intégré de Supabase est très limité (quelques messages par heure,
> réservé aux adresses des membres de l'équipe du projet). Pour de vrais utilisateurs, il faut brancher un SMTP :
> ce sera **Resend en phase 8** (*Authentication → Emails → SMTP Settings*). D'ici là, testez avec votre propre adresse.

**Rate Limits** : les valeurs par défaut de Supabase limitent déjà inscriptions, connexions et envois d'e-mails par IP.

## 4. Créer un administrateur
Le rôle admin ne peut jamais être obtenu depuis le site. Après avoir créé votre compte normalement :
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'vous@exemple.fr');
```

## 5. Modération
- Une entreprise **non vérifiée** qui publie (ou modifie le contenu d'une offre en ligne) voit son offre passer « en vérification » ; l'administrateur la valide ou la refuse avec un motif depuis `/admin/moderation`.
- Une entreprise **vérifiée** (bouton « Vérifier » dans `/admin/entreprises`, après contrôle du SIRET) publie directement.

## 6. Ce que protège la base (RLS)
Vérifié par 123 tests automatisés (`supabase/tests/rls.test.sql`) :
- chaque utilisateur ne lit et ne modifie que son profil ; personne ne peut changer son propre rôle ;
- un recruteur ne voit un candidat (profil, CV, photo) que s'il a postulé à l'une de **ses** offres ;
- seul le recruteur propriétaire change le statut d'une candidature, et uniquement le statut ;
- les visiteurs ne voient que les offres publiées et non expirées ;
- un recruteur ne peut ni mettre son offre « à la une », ni modifier le compteur de vues, ni fixer les dates de publication ;
- les statistiques de vues d'une offre ne sont lisibles que par son propriétaire ;
- CV et photos sont privés (URL signées de courte durée), rangés dans un dossier par utilisateur ;
- la suppression d'un compte efface en cascade profil, candidatures et favoris (et les fichiers, via l'application).
