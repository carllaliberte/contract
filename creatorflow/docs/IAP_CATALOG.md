# CreatorFlow — IAP Catalog (Apple)

Catalogue produit pour **CreatorFlow Pro** sur l’App Store (iOS).  
Ce document décrit les forfaits, identifiants StoreKit et quotas applicatifs.  
**La facturation production n’est pas activée** tant que le bridge Capacitor / StoreKit natif n’est pas branché (`creatorflow/src/lib/iap.ts`).

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

## Bridge StoreKit (P1 — non branché)

Le client expose un hook JS attendu côté natif :

```ts
window.CreatorFlowStoreKit = {
  purchase(productId: string): Promise<{ productId: string }>;
  restore(): Promise<{ activeProductId: string | null }>;
};
```

Fichier stub : `creatorflow/src/lib/iap.ts`

- `purchaseProduct()` / `restorePurchases()` appellent ce bridge **uniquement** sur iOS natif.
- Web et démo : retour `unavailable` — pas de simulation d’achat.
- Après achat / restauration valide : `setCurrentPlan('pro')` côté client ; en production, le plan doit aussi être synchronisé serveur (`profiles.plan`) via validation de reçu.

## UX associée

- **Génération** : dialogue Short | Long ; si Long → durée 8 / 12 / 20 / 30 min + structure chapitrée.
- **Quotas** : vérification par format (`canUseAiGeneration('short' | 'long')`).
- **Paywall** : `PaywallSheet` — CTA Pro, prix mensuel/annuel, bouton **Restaurer les achats**.
- **Paramètres** : affichage du forfait et consommation short/long.

## Textes localisés

Clés i18n : préfixe `paywall.*`, `plan.*`, `script.format*`, `script.duration*` dans `creatorflow/src/i18n/translations.ts` (FR + EN).

## Checklist avant mise en production

1. Créer `cf_pro_monthly` et `cf_pro_yearly` dans App Store Connect (prix CAD).
2. Implémenter plugin Capacitor iOS exposant `CreatorFlowStoreKit`.
3. Valider les reçus côté serveur et mettre à jour `profiles.plan`.
4. Tester sandbox : achat, renouvellement, restauration, expiration.
5. Soumettre métadonnées d’abonnement (nom, description, captures) pour review Apple.

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
