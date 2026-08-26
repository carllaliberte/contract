# CreatorFlow API

Backend for CreatorFlow AI script generation.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/apple` | Exchange Apple `identityToken` for Supabase session |
| `POST` | `/iap/apple/validate` | Verify StoreKit transaction; upgrade `profiles.plan` |
| `POST` | `/ai/generate-script` | Generate script with quota + burst rate limits |
| `GET` | `/health` | Liveness + stub flags |

### `POST /ai/generate-script` flow

1. **Auth** — Supabase JWT (`Authorization: Bearer`) or demo mode (`x-demo-id`)
2. **Quota** — read `ai_usage` + `profiles.plan` for current month
3. **Burst limit** — sliding window (default 6/min); if exceeded → `429 RATE_LIMITED` + `Retry-After`
4. **Limit** — monthly quota; if `count >= limit` → `429 LIMIT_REACHED` + `Retry-After: 86400`
5. **Prompt** — platform-specific instructions (YouTube / TikTok / Reels)
6. **LLM** — OpenAI chat completion (or mock when `MOCK_LLM=true`)
7. **Increment** — atomic usage RPC
8. **Provenance** — metadata row in `ai_generations` (see `provenanceService.ts`)
9. **Response** — `{ script, usage, model }`

### Environment

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | For JWT validation |
| `SUPABASE_SERVICE_ROLE_KEY` | For `ai_usage` / `ai_generations` writes |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `MONTHLY_AI_LIMIT` | Free plan limit (default `8`, matches SQL) |
| `MONTHLY_AI_LIMIT_PRO` | Pro plan limit (default `200`, matches SQL) |
| `MEMORY_STORE` | `true` for in-memory quota (local dev + demo users) |
| `MOCK_LLM` | `true` to skip OpenAI (local dev / tests) |

### Supabase schema

Apply `supabase/migrations/20250825000000_profiles_and_ai.sql`:

| Table | Purpose |
|-------|---------|
| `profiles` | `auth.users` profile, `plan` (`free` / `pro`) |
| `ai_usage` | Monthly `count` per `user_id` + `month` |
| `ai_generations` | Optional generation log |

RPC `increment_ai_usage(uuid, text)` reads plan from `profiles`, enforces limit, returns `{ count, limit, remaining }`.

Demo users (`x-demo-id` → `demo:{uuid}`) always use in-memory quota, not Supabase tables.

### Development

```bash
cd api
npm install
MEMORY_STORE=true MOCK_LLM=true npm run dev
```

Health check: `GET /health`

### CreatorFlow frontend

Set `VITE_API_URL` to the API origin (no trailing slash):

- **Local:** `http://localhost:3000`
- **Fly.io:** `https://creatorflow-api.fly.dev` (see `api/fly.toml`; deploy workflow default)
- **Render:** `https://creatorflow-api.onrender.com` (see `render.yaml` blueprint)

GitHub Actions: set repo variable `VITE_API_URL`, or rely on the deploy workflow default (`creatorflow-api.fly.dev`).

### Render (production)

1. Render Dashboard → **New** → **Blueprint** → connect this repo.
2. The blueprint (`render.yaml`) deploys `creatorflow-api` from the `api/` directory.
3. Set secrets in Render: `SUPABASE_*`, `OPENAI_API_KEY` (optional: set `MEMORY_STORE=false`, `MOCK_LLM=false`).
4. GitHub Actions variable: `VITE_API_URL=https://creatorflow-api.onrender.com` → redeploy CreatorFlow.

### Fly.io (alternative)

1. `cd api && fly deploy` (requires `fly.toml` and Fly CLI auth).
2. GitHub Actions variable: `VITE_API_URL=https://creatorflow-api.fly.dev` → redeploy CreatorFlow.

Local Vite proxy (optional): `/ai` → `http://localhost:3000`.
