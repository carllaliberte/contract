# Clapshot

[![CI Clapshot](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml)
[![Secret scan](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Un script. Publier sur X.**

Clapshot is the only public product in this repository.

Live: [carllaliberte.github.io/contract/clapshot/](https://carllaliberte.github.io/contract/clapshot/)

The loop: **idée → script/hook → Publier sur X**.

The repo is still named `contract` for history. That is not the product name.

Brand canon: [`docs/BRAND.md`](docs/BRAND.md).

## Product rule

Read [`docs/PRODUCT_LANE.md`](docs/PRODUCT_LANE.md) before opening a PR.

- One face (frozen in `#82`)
- Quantum **OFF**
- Do not merge `#74`, `#75`, or Dependabot into this lane
- ClapShot / META (`google-app/`, `meta.sol`) is an archived surface, not a co-equal app

## Quick start

```bash
cd creatorflow
npm ci
cp .env.example .env
npm run dev
```

Docs: [`creatorflow/README.md`](creatorflow/README.md) · Mobile: [`creatorflow/README-MOBILE.md`](creatorflow/README-MOBILE.md)

CI: `.github/workflows/ci-creatorflow.yml` (web + Android debug APK + iOS simulator)

Deploy Pages: `.github/workflows/deploy-creatorflow.yml`

```bash
gh workflow run deploy-creatorflow.yml --ref main
```

- App: https://carllaliberte.github.io/contract/creatorflow/
- Privacy: https://carllaliberte.github.io/contract/creatorflow/privacy.html
- Repo root URL (`/contract/`) redirects to Clapshot

## Layout

```
.
├── creatorflow/    # THE product — web + Capacitor iOS/Android
├── api/            # Scripts / auth helpers for Clapshot
├── shared/         # Shared plans / constants
├── supabase/       # Edge functions (generate-script, auth-apple)
├── docs/           # Ops + the product lane
├── google-app/     # ARCHIVED — ClapShot dashboard (on-chain ticker META)
└── meta.sol        # ARCHIVED — read-only ERC-20, not sold to creators
```

## Documentation

| Doc | Topic |
| --- | --- |
| [`docs/BRAND.md`](docs/BRAND.md) | Clapshot vs ClapShot vs infra ids |
| [`docs/PRODUCT_LANE.md`](docs/PRODUCT_LANE.md) | One product, what is off |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute |
| [`docs/GITHUB_COMMANDS.md`](docs/GITHUB_COMMANDS.md) | Merge canon, deploy Pages |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`docs/SECRETS.md`](docs/SECRETS.md) | Public `VITE_*` vs secrets |
| [`docs/GHA_ORCHESTRATION.md`](docs/GHA_ORCHESTRATION.md) | Clapshot CI → deploy |

## Environment (Clapshot)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Public API base (empty = demo / relative) |
| `VITE_BASE_PATH` / `VITE_ROUTER_BASENAME` | Pages vs native `/` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client-side only when set |

Full matrix: [`docs/SECRETS.md`](docs/SECRETS.md). Never put LLM keys in client `VITE_*`.

## Archived: ClapShot (ticker META)

`google-app/` and `meta.sol` stay in the tree so history is not rewritten. They are **not** the product.

- Pages no longer serves META at the site root
- ClapShot / META deploy is **manual** (`workflow_dispatch` only) and publishes under `/contract/meta/`
- Dependabot no longer watches `google-app/`
- A creator does not buy a token. The App Store does not want a mixed identity

Do not add META features, Play uploads, or WalletConnect work in parallel with Clapshot.

## Contributing & license

- Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- License: [MIT](LICENSE)
