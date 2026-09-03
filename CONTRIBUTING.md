# Contributing

This repository ships **one public product: Clapshot**.

Read [`docs/PRODUCT_LANE.md`](docs/PRODUCT_LANE.md) first.

## Before you start

1. The first screen is frozen (`#82`). Do not restyle it in a drive-by PR.
2. Never commit secrets — [`docs/SECRETS.md`](docs/SECRETS.md) and [`SECURITY.md`](SECURITY.md).
3. One lane. Do not open Quantum AgentBus, META, or Dependabot work next to a Clapshot PR.
4. Prefer small pull requests that serve **idée → pack → tourner**.
5. UNFORGE GitHub writes follow [`docs/UNFORGE.md`](docs/UNFORGE.md): Grok Expert taste → Quantum green → Repo PR. That is the GitHub operating layer, not a second product, and it does not reopen `#74`.

## Development setup

### Prerequisites

- Node.js **22+**
- npm (lockfiles are committed per package)
- For Android: JDK 21 + Android SDK
- For iOS: macOS + Xcode 15+

### Clapshot

```bash
cd creatorflow
npm ci
cp .env.example .env
npm run dev
```

```bash
npm run typecheck
npm test
npm run test:e2e
```

### API (`api/`)

```bash
cd api
npm ci
cp .env.example .env
```

Prefer `MOCK_LLM` / stub modes locally. Never commit real provider keys.

### META (`google-app/`)

Archived (display name ClapShot). Do not start new work here unless Carl explicitly reopens that lane.

## Branch & commit conventions

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `ci/…`.
- Conventional titles: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`.
- Keep commits reviewable.

## Pull requests

1. Open a PR against `main` using the template.
2. Tick **Clapshot** or **CI / docs** — not a second product.
3. CI must be green:
   - CI Clapshot (web)
   - Secret scan (TruffleHog)
   - API CI when `api/` changes
4. Do **not** merge `#74`, `#75`, or Dependabot with product work.
5. Do not force-push to `main`.

Canonical merge: [`docs/GITHUB_COMMANDS.md`](docs/GITHUB_COMMANDS.md).

## License

By contributing, you agree that your contributions are licensed under [`LICENSE`](LICENSE).
