# META — jeton utilitaire (utility token)

META (`METAVERSE` / `META`) est un **jeton utilitaire** dans l’écosystème carllaliberte/contract. Il sert à l’**accès et à l’usage** des fonctionnalités (tableau de bord, futurs quotas CreatorFlow), pas à promettre un rendement financier.

## Ce que META n’est pas

- Pas un produit d’investissement ni un titre financier
- Pas une promesse de gain, de rendement ou de plus-value
- Pas un conseil financier
- L’application **ne demande jamais de clé privée** (connexion wallet non-custodiale en lecture seule)

## Niveaux holder (configuration centralisée)

Les seuils sont définis dans [`shared/meta-entitlements.json`](../../shared/meta-entitlements.json) à la racine du dépôt :

| Niveau | Seuil (META) | Usage dashboard |
| --- | --- | --- |
| **Free** | &lt; seuil Holder | Accès standard |
| **Holder** | ≥ seuil `holder` | Accès étendu / reconnaissance on-chain |
| **Pro (on-chain)** | ≥ seuil `proOnchain` | Niveau on-chain le plus élevé |

Valeurs par défaut (modifiables dans le JSON) :

- Holder : **1** META
- Pro (on-chain) : **1000** META
- Chaîne de référence : `chainId` dans le même fichier (Sepolia `11155111` par défaut)
- Contrat : `contractAddress` dans le même fichier

Après connexion WalletConnect, le dashboard lit `balanceOf(address)` sur la chaîne configurée et affiche le solde + le niveau.

## Implémentation

- Config + résolution des tiers : `shared/meta-entitlements.ts`
- Lecture on-chain : `google-app/src/contract.ts` (`fetchWalletSnapshot`)
- Affichage wallet : `google-app/src/wallet/ui.ts`
- Avertissement UI : section « Utility token notice » dans `google-app/src/main.ts`

## English summary

META is a **utility token** for ecosystem access. Holder tiers are config-driven thresholds checked via on-chain `balanceOf`. No investment promises; no private keys stored.
