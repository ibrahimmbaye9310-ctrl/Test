# E-mails transactionnels (Resend)

| E-mail | Déclencheur | Envoyé par |
|---|---|---|
| Confirmation d'inscription | Inscription | Supabase Auth (SMTP Resend) — modèle `supabase/templates/confirm-signup.html` |
| Réinitialisation du mot de passe | « Mot de passe oublié » | Supabase Auth (SMTP Resend) — modèle `supabase/templates/reset-password.html` |
| Confirmation de candidature | Le candidat postule | Application (`emailApplicationSubmitted`) |
| Nouvelle candidature | Le candidat postule | Application → responsable de l'entreprise |
| Changement de statut | Le recruteur change le statut | Application (`emailApplicationStatus`) |
| Abonnement activé / annonce à l'unité | Paiement Stripe réussi | Webhook Stripe |
| Renouvellement / échec de paiement / fin d'abonnement | Facture payée, échouée, abonnement terminé | Webhook Stripe |

Les envois applicatifs partent **après** la réponse à l'utilisateur (`after()`) : un incident d'e-mail ne bloque jamais une
candidature ni un paiement (il est journalisé). Les adresses sont lues par le serveur uniquement (`server_user_contact`,
`server_company_contact`), jamais exposées au navigateur. Les modèles sont testés (`tests/unit/emails.test.ts`).

## Mise en place
1. Compte sur [resend.com](https://resend.com) → **Domains → Add Domain** : votre domaine (ex. `jobfinder.fr`, ou un
   sous-domaine dédié `mail.jobfinder.fr`, recommandé). Ajoutez chez votre registrar les enregistrements DNS affichés
   (SPF, DKIM, et DMARC conseillé) puis **Verify**.
2. **API Keys → Create** : permission *Sending access*, limitée à ce domaine → `RESEND_API_KEY`.
3. `EMAIL_FROM="JobFinder <notifications@votre-domaine.fr>"` ; laissez `EMAIL_REDIRECT_TO` vide en production.
4. **E-mails Supabase via Resend** (sinon Supabase n'envoie qu'aux membres de l'équipe, quelques messages par heure) :
   Supabase → *Authentication → Emails → SMTP Settings* → *Enable custom SMTP* :
   - Host `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = une clé API Resend
   - Expéditeur : `notifications@votre-domaine.fr`, nom : `JobFinder`
5. Supabase → *Authentication → Emails → Templates* : collez le contenu de `supabase/templates/confirm-signup.html`
   (« Confirm signup ») et `reset-password.html` (« Reset password »), avec les sujets :
   - `Confirmez votre adresse e-mail — JobFinder`
   - `Réinitialisation de votre mot de passe — JobFinder`
6. *Authentication → Rate Limits* : relevez la limite d'e-mails par heure une fois le SMTP en place (ex. 100).

## Tests
`EMAIL_REDIRECT_TO=delivered@resend.dev` (adresse de test Resend) redirige tous les envois ; le sujet indique le
destinataire réel (`[test → …]`).
