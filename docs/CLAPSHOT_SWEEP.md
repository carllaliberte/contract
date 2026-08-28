# ClapShot — une passe, stop

Nom public : **ClapShot**. Pas CreatorFlow. Pas Clapshop.

## Gelé (ne pas renommer)

| Identifiant | Pourquoi |
| --- | --- |
| Dossier `creatorflow/` | Capacitor / npm / CI |
| `com.carllaliberte.creatorflow` | Apple + Play |
| `/contract/creatorflow/auth/apple` | Sign in with Apple |
| Secret `CREATORFLOW_APPLE_CONFIG` | Archive iOS |
| Fichiers `ci-creatorflow.yml`, `deploy-creatorflow.yml` | Actions IDs |
| Package npm `creatorflow` | lockfile |

## Live

- App : https://carllaliberte.github.io/contract/clapshot/
- Ancien `/contract/creatorflow/` : redirect only

## Secrets (audit 2026-08-28)

- Aucune clé privée RSA / service role / XAI dans le tree indexé.
- JWT anon Supabase dans le workflow deploy = **public par design**.
- `OPENAI_API_KEY` / `XAI_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` : secrets serveur seulement (`docs/SECRETS.md`).
- TruffleHog : `secret-scan.yml` reste.

## Workflows (déjà passés)

- CI : cancel-in-progress, Android/iOS seulement `workflow_dispatch`.
- Deploy : cancel-in-progress, dernier commit gagne.
- Noms affichés : CI Clapshot / Deploy Clapshot.
- Ne pas fusionner META / google-app dans cette lane.

## Traces CreatorFlow restantes (hors gel)

Docs et logs : README app, STORE.md, SECURITY.md, README-MOBILE, docs IAP/iOS/Search, `.env.example` header, `native.ts` `[CreatorFlow FATAL]`, `api/src/index.ts` log, commentaires `shared/plans.ts`.

UI src : quasi propre. Types e2e `CreatorFlowFixtures`, pont IAP `CreatorFlowStoreKit` = identifiants natifs — laisser.

## Stop

Pas de feature. Pas de rename de dossier. Prochain humain : remplacer les titres docs ci-dessus par ClapShot, rien d’autre.
