# Security Policy

## Supported versions

| Component | Supported |
| --- | --- |
| `main` branch (latest) | Yes |
| Older commits / forks | Best-effort only |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Prefer one of these private channels:

1. **GitHub Security Advisories** (recommended):  
   [Report a vulnerability](https://github.com/carllaliberte/contract/security/advisories/new) on this repository.
2. **Email**: [laliberte22@gmail.com](mailto:laliberte22@gmail.com) with subject `[SECURITY] carllaliberte/contract`.

Please include:

- Affected path (e.g. `creatorflow/`, `api/`, `google-app/`, workflows)
- Description and impact
- Steps to reproduce or a proof of concept
- Whether the issue is already public elsewhere

We aim to acknowledge reports within **7 days** and to share a remediation plan when possible.

## Scope

In scope:

- Authentication / session handling (CreatorFlow Apple Sign In, `POST /auth/apple`)
- In-app purchase validation (`POST /iap/apple/validate`)
- AI rate limiting and quota enforcement (`429` + `Retry-After`)
- Secret leakage in client bundles, CI logs, or the git history
- Dependency vulnerabilities with a realistic exploit path
- Misconfigured GitHub Actions that could expose secrets
- On-chain contract surface (`meta.sol`) and read-only wallet integrations

Out of scope:

- Social engineering / phishing
- Denial of service against public RPCs or third-party APIs
- Issues only present in outdated forks or local misconfiguration

## Secrets & client policy

- Never commit `.env`, keystores, service-account JSON, or API private keys.
- `VITE_*` variables are **public** (embedded in the client build). Do not put secrets there.
- Server-only secrets (OpenAI, Supabase service role, Apple private key, App Store shared secret, Play signing) stay on the server / GitHub Actions secrets.

See [`docs/SECRETS.md`](docs/SECRETS.md) and CreatorFlow-specific notes in [`creatorflow/SECURITY.md`](creatorflow/SECURITY.md).

## API security surface

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `POST /auth/apple` | Public | Validates Apple `identityToken` (JWKS); returns Supabase session or dev stub |
| `POST /iap/apple/validate` | Bearer JWT | Verifies StoreKit transaction; updates `profiles.plan` |
| `POST /ai/generate-script` | Bearer or `x-demo-id` | Monthly quotas + burst rate limit before LLM |

Burst limits default to **6 requests / 60s** per user (`AI_RATE_LIMIT_*` env). Monthly quota exhaustion returns `429 LIMIT_REACHED` with `Retry-After: 86400`.

## AI provenance

Successful generations log metadata to `ai_generations` (platform, format, model, plan, title hash — not full prompts). See `api/src/services/provenanceService.ts`.

## Automated scanning

| Tool | Workflow |
| --- | --- |
| TruffleHog (secret scan) | `.github/workflows/secret-scan.yml` |
| Secret hygiene (path checks) | `.github/workflows/secret-hygiene.yml` |
| Dependabot | `.github/dependabot.yml` |

## Disclosure

Please give us a reasonable window to patch before public disclosure. Coordinated disclosure is appreciated.
