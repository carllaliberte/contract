# contract

[![CI CreatorFlow](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/ci-creatorflow.yml)
[![Secret scan](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/carllaliberte/contract/actions/workflows/secret-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Monorepo for the **META** ERC-20 surface and **CreatorFlow** (content pipeline) — web, Android, and iOS.

| App | Path | Platforms | Live |
| --- | --- | --- | --- |
| **META Dashboard** | [`google-app/`](google-app/) | Web, Android (Play) | [GitHub Pages](https://carllaliberte.github.io/contract/) |
| **CreatorFlow** | [`creatorflow/`](creatorflow/) | Web, iOS, Android | [GitHub Pages](https://carllaliberte.github.io/contract/creatorflow/) |
| **API** | [`api/`](api/) | Node | Deploy separately / Supabase Edge |
| **Contract** | [`meta.sol`](meta.sol) | Solidity | Read-only from the META dashboard |

## Repository layout

```
.
├── google-app/     # META web + Capacitor Android + Play listing
├── creatorflow/    # CreatorFlow web + Capacitor iOS/Android
├── api/            # Backend for scripts / auth helpers
├── shared/         # Shared plans / constants
├── supabase/       # Edge functions (e.g. generate-script)
├── scripts/        # Local deploy / keystore helpers
└── docs/           # Ops: secrets, GHA, TruffleHog, GitHub Pro setup
```

## Quick start

### CreatorFlow

```bash
cd creatorflow
npm ci
cp .env.example .env
npm run dev
```

- Docs: [`creatorflow/README.md`](creatorflow/README.md) · Mobile: [`creatorflow/README-MOBILE.md`](creatorflow/README-MOBILE.md)
- CI: `.github/workflows/ci-creatorflow.yml` (web + Android debug APK + iOS simulator)

### META dashboard

```bash
cd google-app
npm ci
cp .env.example .env
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Demo config lives in `google-app/deployment.json` (contract address, Sepolia RPC, privacy URL, package `com.carllaliberte.meta`).

### API

```bash
cd api
npm ci
cp .env.example .env
```

See [`api/README.md`](api/README.md). Never put LLM keys in client `VITE_*` env.

## Documentation

| Doc | Topic |
| --- | --- |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute, PR expectations |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`docs/SECRETS.md`](docs/SECRETS.md) | Public `VITE_*` vs secrets, GitHub Actions |
| [`docs/GHA_ORCHESTRATION.md`](docs/GHA_ORCHESTRATION.md) | CreatorFlow CI → deploy control plane |
| [`docs/TRUFFLEHOG.md`](docs/TRUFFLEHOG.md) | Secret scan policy |
| [`docs/GITHUB_PRO_SETUP.md`](docs/GITHUB_PRO_SETUP.md) | Branch protection, Security, CODEOWNERS checklist |

## META — Google Play & Firebase

Android is a Capacitor wrapper (`google-app/android/`).

```bash
cd google-app
npm ci
npm run generate-icons
npm run cap:sync
npm run android:bundle   # requires Android SDK
```

CI builds a release AAB on pushes to `main` (`.github/workflows/android-play-release.yml`).

Play Console checklist (FR): `google-app/play-store/LISTING.md`.  
Privacy: https://carllaliberte.github.io/contract/privacy.html

Generate an upload keystore and prepare GitHub secrets:

```bash
ANDROID_KEYSTORE_PASSWORD='…' ANDROID_KEY_PASSWORD='…' \
  bash scripts/generate-android-keystore.sh
bash scripts/prepare-play-github-secrets.sh
```

### Firebase Hosting

```bash
cd google-app
npm run build
npx firebase deploy --only hosting
```

Set the project ID in `google-app/.firebaserc`. Optional CI secret: `FIREBASE_TOKEN`.

### WalletConnect

The META dashboard uses **wagmi + viem + WalletConnect** (non-custodial). Chains: `google-app/src/wallet/chains.ts`.

1. Create a project at [WalletConnect Cloud](https://cloud.walletconnect.com).
2. Set `VITE_WALLETCONNECT_PROJECT_ID` in `google-app/.env` (or Actions **vars**).
3. Whitelist origins: `https://carllaliberte.github.io`, `http://localhost:5173`, and your Firebase domain if used.

### Google Sheets

Copy `google-app/apps-script/Code.gs` into a sheet’s Apps Script editor; set `CONTRACT_ADDRESS` and `RPC_URL`.

### Regenerate ABI

After editing `meta.sol`:

```bash
cd google-app
npm run compile-contract
```

The on-chain token is a reflection-style ERC-20 (`METAVERSE` / `META`) with transfer fee, max tx, and sell lock. The Google app is **read-only**.

## Environment variables (summary)

| Variable | App | Notes |
| --- | --- | --- |
| `VITE_API_URL` | CreatorFlow | Public API base (empty = demo / relative) |
| `VITE_BASE_PATH` / `VITE_ROUTER_BASENAME` | CreatorFlow / META | Pages vs native `/` |
| `VITE_CONTRACT_ADDRESS` / `VITE_RPC_URL` | META | Contract + RPC |
| `VITE_WALLETCONNECT_PROJECT_ID` | META | Public WalletConnect project ID |

Full matrix: [`docs/SECRETS.md`](docs/SECRETS.md).

## Contributing & license

- Contributions: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- License: [MIT](LICENSE)
