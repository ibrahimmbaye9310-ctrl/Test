# Liste de vérification avant lancement

## Bloquant
- [ ] **Nom de domaine** acheté et relié à Vercel (`docs/DEPLOIEMENT.md`, étape 4).
- [ ] **Mentions légales, confidentialité, CGU** : remplacer tous les champs entre crochets (raison sociale, SIREN, adresse,
      directeur de la publication, CGV) et faire relire par un juriste ; retirer alors le bandeau « Document à finaliser »
      (`draft` dans `src/app/(site)/{mentions-legales,confidentialite,cgu}/page.tsx`).
- [ ] **Adresse de contact** réelle : `contactEmail` dans `src/lib/config/site.ts`.
- [ ] Variables de production complètes sur Vercel ; journal `[config] configuration complète` au démarrage.
- [ ] **Resend** : domaine vérifié (SPF, DKIM, DMARC) ; **SMTP Supabase** branché ; modèles d'e-mails Supabase collés.
- [ ] **Supabase** : *Confirm email* activé ; Site URL et Redirect URLs sur le domaine ; pg_cron actif.
- [ ] **Stripe** : compte activé, produits créés en mode live, webhook live (6 événements, réponses 200),
      **Stripe Tax** configuré (TVA) puis `STRIPE_AUTOMATIC_TAX=true`.
- [ ] Vérifications après déploiement réalisées (`docs/DEPLOIEMENT.md`, étape 8).

## Nettoyage des éléments de test
- [ ] Comptes de test : `delete from auth.users where email like 'e2e.%@example.com' or email like 'qa.%@example.com';`
- [ ] Fichiers de test : Supabase → *Storage* → vider `cvs`, `avatars`, `logos` (s'il n'y a encore aucun vrai utilisateur).
- [ ] Clé de facturation de test : `delete from private.settings where key = 'billing_key_sha256';`
- [ ] Environnements cloud de Claude « Test (JobFinder) » et « jobfinder-tests » : supprimer leurs identifiants
      (Stripe test, Resend) si vous ne poursuivez pas le développement avec Claude.
- [ ] Projet Supabase de Londres (ancien) supprimé.

## Recommandé
- [ ] Compte administrateur personnel (`docs/SUPABASE.md`, section 4).
- [ ] Sauvegardes : Supabase (offre gratuite : pas de sauvegarde automatique restaurable ; l'offre Pro en fournit).
- [ ] Surveillance : *Vercel → Logs* et *Stripe → Webhooks* consultés la première semaine.
- [ ] Registre des traitements RGPD (CNIL) tenu à jour ; contrats de sous-traitance (DPA) de Vercel, Supabase, Stripe
      et Resend acceptés depuis leurs tableaux de bord.
- [ ] Google Search Console : domaine vérifié, sitemap `https://votre-domaine.fr/sitemap.xml` soumis.
- [ ] Premiers avis authentiques recueillis avec consentement écrit, puis publiés depuis `/admin/avis`.
