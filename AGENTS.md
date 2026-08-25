# AGENTS.md — Guide for AI agents (Cursor, Copilot, Claude, etc.)

This file helps **any AI coding agent** work on the CreatorFlow monorepo consistently.

## Repository map

| Path | Purpose |
|------|---------|
| `creatorflow/` | React/Vite app — web, iOS (Capacitor), Android |
| `api/` | Hono Node API — auth, AI, IAP validation |
| `shared/plans.ts` | **Single source of truth** for plan quotas + IAP product IDs |
| `supabase/` | Migrations + Edge Functions |
| `google-app/` | META token dashboard (separate app) |

## Golden rules

1. **Never put secrets in `VITE_*` env** — OpenAI keys, Supabase service role, Apple private keys stay server-side.
2. **Plan quotas** — edit `shared/plans.ts` only; re-exported by `api/` and `creatorflow/`.
3. **iOS native builds** — use `npm run build:ios` (sets `VITE_BASE_PATH=/`), not plain `npm run build`.
4. **IAP** — client calls StoreKit plugin → server validates at `POST /iap/apple/validate` → `profiles.plan` updated.
5. **Demo mode** — `x-demo-id` header; demo users cannot purchase Pro.

## Branch & PR workflow

Branch naming for Cursor Cloud Agents: `cursor/<descriptive-name>-5045`

**Known constraint:** GitHub ruleset `CreatorFlow` may block branch creation for integration tokens. If push fails:

```bash
# Run locally as repo owner (or add agent to ruleset bypass):
bash scripts/push-agent-branch.sh cursor/app-store-iap-option-b-5045
```

Or temporarily allow branch creation in: GitHub → Settings → Rules → CreatorFlow.

## Environment variables

### Client (`creatorflow/.env`)

| Variable | Production |
|----------|------------|
| `VITE_API_URL` | Your deployed API base URL |
| `VITE_AUTH_STUB` | **Must be unset** |
| `VITE_BASE_PATH` | `/` for iOS; `/contract/creatorflow/` for GitHub Pages |

### API (`api/.env`)

| Variable | Production |
|----------|------------|
| `SUPABASE_*` | Required |
| `OPENAI_API_KEY` | Required for real AI |
| `APPLE_CLIENT_ID` | `com.carllaliberte.creatorflow` |
| `MEMORY_STORE` | `false` |
| `MOCK_IAP` | `false` |
| `MOCK_APPLE_AUTH` | `false` |

## Key API routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/apple` | No | Exchange Apple identity token → session JWT |
| POST | `/ai/generate-script` | Bearer or x-demo-id | AI script generation |
| POST | `/iap/apple/validate` | Bearer | Validate StoreKit transaction → Pro |
| POST | `/iap/apple/restore` | Bearer | Restore purchases |
| POST | `/iap/apple/notifications` | Apple signed payload | Server notifications V2 |
| GET | `/profile` | Bearer | Plan + usage snapshot |

## iOS / App Store

- Plugin: `creatorflow/plugins/creatorflow-storekit/`
- Product IDs: `cf_pro_monthly`, `cf_pro_yearly` (see `shared/plans.ts`)
- Full checklist: `creatorflow/docs/APP_STORE_CONNECT.md`
- Privacy URL: `creatorflow/public/privacy.html`

## Test commands

```bash
cd api && npm test
cd creatorflow && npm run typecheck && npm test
cd creatorflow && npm run build:ios   # requires macOS for Xcode archive
```

## Inter-agent handoff

When one agent completes work another should continue:

1. Commit on branch `cursor/<task>-5045`
2. Document blockers in PR comment or `creatorflow/docs/`
3. Export patch if push blocked: `git format-patch origin/main -o /tmp/patches`
4. Reference this file + `creatorflow/SECURITY.md` for security baseline

## Contacts

- Owner: Carl Laliberté — laliberte22@gmail.com
- Support: GitHub Issues on `carllaliberte/contract`
