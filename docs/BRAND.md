# Brand

Public product: **Clapshot** (logo monogram **C**).

Crypto / META is **later**. `google-app/` and `meta.sol` stay archived.
Do not rename the token, ship a wallet, or mix a second public identity with Clapshot.

## What changes with the name

User-facing Clapshot copy, store listings, PWA names, Pages titles, iOS/Android **display** names.

## What does not change (on purpose)

These are infrastructure identities. Renaming them splits the App Store, Play, Pages, and secrets.

| Surface | Kept |
| --- | --- |
| GitHub repo | `carllaliberte/contract` |
| App folder / Pages path | `creatorflow/` → `/contract/creatorflow/` |
| iOS / Android bundle id | `com.carllaliberte.creatorflow` |
| Archived META Android id | `com.carllaliberte.meta` |
| Workflow files | `ci-creatorflow.yml`, `deploy-creatorflow.yml`, … |
| Apple config secret | `CREATORFLOW_APPLE_CONFIG` |
| Native IAP bridge | `CreatorFlowStoreKit` |
| IAP product ids | `cf_pro_monthly`, `cf_pro_yearly` |
| Demo flags | `cf-demo`, `cf-ideas` |
| On-chain ticker | `META` / `METAVERSE` |

To ship a new bundle id, Pages path, or crypto product, that is a later project — not this lane.
