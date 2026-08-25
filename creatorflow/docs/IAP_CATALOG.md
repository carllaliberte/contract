# CreatorFlow — IAP Catalog (Apple)

Catalogue produit pour **CreatorFlow Pro** sur l’App Store (iOS).  
Ce document décrit les forfaits, identifiants StoreKit et quotas applicatifs.  
**La facturation production** passe par le plugin Capacitor `creatorflow-storekit` et la validation serveur (`POST /iap/apple/validate`).

## Forfaits applicatifs

| Plan | Scripts courts / mois | Scripts longs / mois | Durée long max |
|------|----------------------:|---------------------:|---------------:|
| **Free** | 8 | 2 | 12 min |
| **Pro** | 100 | 50 | 30 min |

- **Court** : TikTok, Reels, YouTube Shorts — scripts dynamiques 15–90 s.
- **Long** : YouTube long format — structure **chapitrée** (hook, chapitres numérotés, récap + CTA). Durées proposées : 8, 12, 20 ou 30 min (selon plan).

Configuration source : `shared/plans.ts`, re-exported by `creatorflow/src/lib/plans.ts`, `api/src/limits.ts`, migration `supabase/migrations/20250825120000_script_format_quotas.sql`.

## Produits App Store (abonnements)

| Product ID | Type | Prix cible (CAD) | Plan débloqué |
|------------|------|------------------|---------------|
| `cf_pro_monthly` | Auto-renewable subscription (mensuel) | **6,99 $ / mois** | Pro |
| `cf_pro_yearly` | Auto-renewable subscription (annuel) | **59,99 $ / an** | Pro |

Ces identifiants doivent être créés dans **App Store Connect** (même bundle ID : `com.carllaliberte.creatorflow`) et reliés au groupe d’abonnements CreatorFlow Pro.

## Bridge StoreKit (branché)

Plugin Capacitor : `creatorflow/plugins/creatorflow-storekit/`

Client : `creatorflow/src/lib/iap.ts` → `CreatorFlowStoreKit.purchase()` → `POST /iap/apple/validate`

## UX associée

- **Génération** : dialogue Short | Long ; si Long → durée 8 / 12 / 20 / 30 min + structure chapitrée.
- **Quotas** : vérification par format (`canUseAiGeneration('short' | 'long')`).
- **Paywall** : `PaywallSheet` — CTA Pro, prix mensuel/annuel, bouton **Restaurer les achats**.
- **Paramètres** : affichage du forfait et consommation short/long.

## Textes localisés

Clés i18n : préfixe `paywall.*`, `plan.*`, `script.format*`, `script.duration*` dans `creatorflow/src/i18n/translations.ts` (FR + EN).

## Checklist avant mise en production

1. Créer `cf_pro_monthly` et `cf_pro_yearly` dans App Store Connect (prix CAD).
2. ~~Implémenter plugin Capacitor iOS~~ ✅ `creatorflow-storekit`
3. ~~Valider les reçus côté serveur~~ ✅ `POST /iap/apple/validate`
4. Configurer App Store Server Notifications → `POST /iap/apple/notifications`
5. Tester sandbox : achat, renouvellement, restauration, expiration.
6. Soumettre métadonnées d’abonnement (voir `docs/APP_STORE_CONNECT.md`).

## Références code

| Fichier | Rôle |
|---------|------|
| `shared/plans.ts` | Limites, product IDs, prix affichés |
| `creatorflow/src/lib/plans.ts` | Re-export client |
| `creatorflow/src/lib/iap.ts` | Stub StoreKit |
| `creatorflow/src/components/PaywallSheet.tsx` | Paywall + restaurer |
| `creatorflow/src/components/ScriptGenerateDialog.tsx` | Toggle Short/Long |
| `api/src/routes/ai.ts` | Enforcement quotas API |
| `supabase/functions/generate-script/index.ts` | Edge Function production |
