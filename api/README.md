# CreatorFlow API

Backend for CreatorFlow AI script generation.

## Endpoint

`POST /ai/generate-script`

### Flow

1. **Auth** — Supabase JWT (`Authorization: Bearer`) or demo mode (`x-demo-id`)
2. **Quota** — read `ai_usage` + `profiles.plan` for current month
3. **Limit** — free = 8/mo, pro = 200/mo; if `count >= limit` → `429` `LIMIT_REACHED`
4. **Prompt** — platform-specific instructions (YouTube / TikTok / Reels)
5. **LLM** — OpenAI chat completion (or mock when `MOCK_LLM=true`)
6. **Increment** — atomic `increment_ai_usage(user_id uuid, month)` RPC
7. **Log** — optional row in `ai_generations`
8. **Response** — `{ script, usage, model }`

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
| `APPLE_CLIENT_IDS` | JWT `aud` values — `com.carllaliberte.creatorflow,com.carllaliberte.creatorflow.web` |
| `APPLE_AUTH_STUB` | `true` only for local dev without Supabase (never production) |
| `CORS_ORIGINS` | Include GitHub Pages + Capacitor origins (`https://localhost`, `capacitor://localhost`) |

### Sign in with Apple

`POST /auth/apple` — body: `{ identityToken, authorizationCode?, user?, email?, givenName?, familyName? }`.

1. Verifies Apple `identityToken` via JWKS (`jose`).
2. Exchanges with `supabase.auth.signInWithIdToken({ provider: "apple", token })`.
3. Returns `{ accessToken, userId, provider: "apple" }`.

Setup guide (Apple Developer, Supabase, Fly): `creatorflow/docs/SIGN_IN_WITH_APPLE.md`.

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

Set `VITE_API_URL` to the API origin (no trailing slash), e.g. `http://localhost:3000`.

Production example: `https://creatorflow-api.fly.dev` (also used for `POST /auth/apple`).

Local Vite proxy (optional): `/ai` → `http://localhost:3000`.
