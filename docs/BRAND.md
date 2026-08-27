# Brand

Public product: **Clapshot** (logo monogram **C**).

Archived utility token display name: **ClapShot**.
On-chain ticker on any already-deployed contract stays `META` / `METAVERSE`.
Do not treat a ticker change as a redeploy in this lane.

## What changes with the name

User-facing copy, store listings, PWA names, Pages titles, iOS/Android **display** names.

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

To ship a new bundle id or Pages path, that is a later store/DNS project — not this lane.
