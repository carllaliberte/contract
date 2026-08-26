# Contributing

Thanks for helping improve **carllaliberte/contract** (META dashboard + CreatorFlow + API).

## Before you start

1. Read the root [`README.md`](README.md) for the monorepo layout.
2. Never commit secrets — see [`docs/SECRETS.md`](docs/SECRETS.md) and [`SECURITY.md`](SECURITY.md).
3. Prefer small, focused pull requests over large mixed changes.

## Development setup

### Prerequisites

- Node.js **22+**
- npm (lockfiles are committed per package)
- For Android: JDK 21 + Android SDK
- For iOS: macOS + Xcode 15+

### CreatorFlow

```bash
cd creatorflow
npm ci
cp .env.example .env
npm run dev
```

Tests / checks (from `creatorflow/`):

```bash
npm run typecheck   # if available
npm test            # unit
npm run test:e2e    # Playwright (when configured)
```

### META dashboard (`google-app/`)

```bash
cd google-app
npm ci
cp .env.example .env
npm run dev
```

### API (`api/`)

```bash
cd api
npm ci
cp .env.example .env
# Prefer MOCK_LLM / stub modes in local CI — never commit real OpenAI keys
```

## Branch & commit conventions

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, or Cloud Agent style `cursor/<topic>-…`.
- Prefer conventional commit titles: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`.
- Keep commits reviewable; rebase/squash only when asked.

## Pull requests

1. Open a PR against `main` using the repository template.
2. Fill **Summary** and **Test plan**.
3. Ensure CI is green:
   - CI CreatorFlow (web / android / ios)
   - Secret scan (TruffleHog)
   - Secret hygiene
   - API CI when `api/` changes
4. Link related issues with `Fixes #123` when applicable.
5. Do not force-push to `main`. Avoid rewriting shared history on open PR branches unless coordinating with reviewers.

For the canonical merge path (`--no-ff`, no force-push on `main`), see [`docs/GITHUB_COMMANDS.md`](docs/GITHUB_COMMANDS.md).

## Issues

Use the issue templates:

- **Bug report** — unexpected behavior with reproduction steps
- **Feature request** — product or DX improvement with clear motivation

Security issues → [`SECURITY.md`](SECURITY.md) (private advisory / email), not public issues.

## Code owners

See [`.github/CODEOWNERS`](.github/CODEOWNERS). Reviews may be requested automatically for sensitive paths (workflows, secrets docs, mobile signing).

## License

By contributing, you agree that your contributions are licensed under the same terms as the repository ([`LICENSE`](LICENSE)).
