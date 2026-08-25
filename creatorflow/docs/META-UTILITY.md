# META — jeton utilitaire dans CreatorFlow

META est un **jeton utilitaire** (accès / usage dans l’écosystème), **pas** un produit d’investissement. Aucune promesse de gain. CreatorFlow **ne stocke ni ne demande de clés privées**.

## Configuration centralisée

Tous les seuils et adresses proviennent de [`shared/meta-entitlements.json`](../../shared/meta-entitlements.json) :

| Champ | Rôle |
| --- | --- |
| `contractAddress` | Contrat ERC-20 META |
| `chainId` | Chaîne EVM pour vérifier le solde |
| `thresholds.holder` | Seuil minimum « Holder » (META, unités humaines) |
| `thresholds.proOnchain` | Seuil « Pro (on-chain) » |
| `creatorflow.holderBonusAiPerMonth` | Bonus quota IA si holder vérifié |

La logique de tier est partagée : [`shared/meta-entitlements.ts`](../../shared/meta-entitlements.ts).

## Quotas IA actuels

| Plan | Générations / mois |
| --- | --- |
| Free | 8 |
| Pro (abonnement) | 200 |

Constantes : `creatorflow/src/lib/limits.ts` (+ miroirs API / Supabase).

## Évolution prévue (même esprit que le dashboard META)

1. **Connexion wallet** (lecture seule) dans CreatorFlow
2. Si `balanceOf(META) ≥ thresholds.holder` sur la chaîne configurée → **bonus quota scripts** (`holderBonusAiPerMonth`, vérifié côté serveur)
3. **IAP (In-App Purchase) reste le chemin Pro principal sur iOS** — le bonus holder complète le plan Free, il ne remplace pas l’abonnement Pro App Store

```ts
// creatorflow/src/lib/limits.ts (aperçu)
import { metaEntitlements } from "../../../shared/meta-entitlements";

export const META_HOLDER_BONUS_AI = metaEntitlements.creatorflow.holderBonusAiPerMonth;
```

## Disclaimer

> META est un jeton utilitaire pour l’accès et l’usage dans l’écosystème (quotas optionnels, fonctionnalités). Ce n’est pas un produit d’investissement ni une promesse de rendement. Détention de META sans garantie de gain.

Voir aussi : [`google-app/docs/META-UTILITY.md`](../../google-app/docs/META-UTILITY.md).

## English summary

META grants optional ecosystem entitlements (e.g. bonus AI quota for verified holders). Pro on iOS stays IAP-first. Thresholds live in `shared/meta-entitlements.json` — do not hardcode amounts in app code.
