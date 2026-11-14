# Stripe — paiements et abonnements

## Fonctionnement
| Formule | Prix | Annonces actives | Avantages |
|---|---|---|---|
| Starter | 29 € HT / mois | 3 | Gestion des candidatures, profil entreprise, statistiques essentielles |
| Pro | 59 € HT / mois | 10 | **Mise en avant automatique** des annonces, **statistiques avancées** |
| Annonce à l'unité | 9,90 € HT | +1 pendant 30 jours | Sans abonnement, cumulable avec une formule |

- Une annonce est **active** si elle est en ligne (non expirée) ou en vérification.
- La limite est **contrôlée par la base** à chaque publication (trigger `enforce_offer_quota`) : impossible à contourner.
  Formule pleine → un crédit « à l'unité » est consommé automatiquement s'il en reste ; sinon la publication est refusée.
- Le paiement se fait sur les pages hébergées par Stripe (Checkout, portail client) : **aucune donnée bancaire chez JobFinder**.
- Les abonnements, paiements et crédits ne sont écrits que par le **webhook** (signature vérifiée, événements traités une seule fois).
- `past_due` (relance après un échec de paiement) : la formule reste active pendant les relances de Stripe.

## Mise en place (mode Test d'abord)
1. Créez un compte sur [dashboard.stripe.com](https://dashboard.stripe.com) et restez en **mode Test** (interrupteur en haut à droite).
2. **Clé secrète** : *Développeurs → Clés API → Clé secrète* (`sk_test_…`).
3. **Produits et prix** : `STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup.mjs` → copiez les 3 lignes `STRIPE_PRICE_…`.
   Le script configure aussi le portail client (changement de formule, résiliation en fin de période, factures).
4. **Webhook** (une fois le site déployé) : *Développeurs → Webhooks → Ajouter un endpoint*
   - URL : `https://<votre-domaine>/api/stripe/webhook`
   - Événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copiez le **secret de signature** (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.
5. Variables Vercel : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`,
   `STRIPE_PRICE_SINGLE_OFFER`, et `SUPABASE_SECRET_KEY` (le webhook écrit la facturation avec cette clé).
6. Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque. Échec : `4000 0000 0000 0341`.

## Passage en production
- Activez votre compte Stripe (informations légales, IBAN), relancez le script avec la clé **live** (`sk_live_…`), créez le
  webhook en mode live et remplacez les variables dans Vercel.
- **TVA** : les prix sont créés « hors taxes » (`tax_behavior: exclusive`). Configurez **Stripe Tax** (adresse d'origine,
  immatriculation TVA) puis mettez `STRIPE_AUTOMATIC_TAX=true` : la TVA sera ajoutée et figurera sur les factures.
  Sans Stripe Tax, le montant HT affiché est débité tel quel.
- Activez l'envoi des reçus et factures par e-mail dans *Paramètres → E-mails clients*.
