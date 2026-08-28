# ClapShot

[![CI Clapshot](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml)
[![Secret scan](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Un script. Une image. Publier sur X.**

ClapShot is the only public product in this repository.

Live: [carllaliberte.github.io/contract/clapshot/](https://carllaliberte.github.io/contract/clapshot/)

The loop: **idée → script/hook → image → Publier sur X**. Instagram and TikTok stay secondary. Vertical clip 6–15s is optional.

The repo is still named `contract` for history. That is not the product name.

Brand canon: [`docs/BRAND.md`](docs/BRAND.md).

## Product rule

Read [`docs/PRODUCT_LANE.md`](docs/PRODUCT_LANE.md) before opening a PR.

- One public face: ClapShot
- Quantum **OFF**
- Do not merge `#74`, `#75`, or Dependabot into this lane
- `google-app/` and `meta.sol` are archived META surfaces, not a second app

## Quick start

```bash
cd creatorflow
npm ci
cp .env.example .env
npm run dev
```

Docs: [`creatorflow/README.md`](creatorflow/README.md) · Mobile: [`creatorflow/README-MOBILE.md`](creatorflow/README-MOBILE.md)

CI: `.github/workflows/ci-creatorflow.yml` (web on every push; Android / iOS on `workflow_dispatch`)

Deploy Pages: `.github/workflows/deploy-creatorflow.yml`

```bash
gh workflow run deploy-creatorflow.yml --ref main
```

- App: https://carllaliberte.github.io/contract/clapshot/
- Privacy: https://carllaliberte.github.io/contract/clapshot/privacy.html
- Legacy `/contract/creatorflow/` redirects to ClapShot
- Repo root URL (`/contract/`) redirects to ClapShot

## Layout

```
.
├── creatorflow/    # THE product (folder name frozen) — web + Capacitor
├── api/            # Scripts / auth helpers for ClapShot
├── shared/         # Shared plans / constants
├── supabase/       # Edge functions (generate-script, generate-poster, generate-clip, auth-apple)
├── docs/           # Ops + the product lane
├── google-app/     # ARCHIVED — META dashboard
└── meta.sol        # ARCHIVED — read-only ERC-20, not sold to creators
```

## Documentation

| Doc | Topic |
| --- | --- |
| [`docs/BRAND.md`](docs/BRAND.md) | ClapShot vs frozen infra ids |
| [`docs/PRODUCT_LANE.md`](docs/PRODUCT_LANE.md) | One product, what is off |
| [`docs/CLAPSHOT_SWEEP.md`](docs/CLAPSHOT_SWEEP.md) | One-pass sweep, what stays frozen |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute |
| [`docs/GITHUB_COMMANDS.md`](docs/GITHUB_COMMANDS.md) | Merge canon, deploy Pages |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`docs/SECRETS.md`](docs/SECRETS.md) | Public `VITE_*` vs secrets |
| [`docs/GHA_ORCHESTRATION.md`](docs/GHA_ORCHESTRATION.md) | ClapShot CI → deploy |

## Environment (ClapShot)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Public API base (empty = local pack / relative) |
| `VITE_BASE_PATH` / `VITE_ROUTER_BASENAME` | Pages `/contract/clapshot/` vs native `/` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client-side only when set |

Full matrix: [`docs/SECRETS.md`](docs/SECRETS.md). Never put LLM or Imagine keys in client `VITE_*`.

## Archived: META

`google-app/` and `meta.sol` stay in the tree so history is not rewritten. They are **not** ClapShot.

- Pages no longer serves META at the site root
- META deploy is **manual** and publishes under `/contract/meta/`
- A creator does not buy a token

## Contributing & license

- Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- License: [MIT](LICENSE)
