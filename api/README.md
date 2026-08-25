# CreatorFlow API

Backend for CreatorFlow AI script generation.

## Endpoint

`POST /ai/generate-script`

### Flow

1. **Auth** — Supabase JWT (`Authorization: Bearer`) or demo mode (`x-demo-id`)
2. **Quota** — read `ai_usage` for current month
3. **Limit** — if `count >= limit` → `429` with `error: LIMIT_REACHED`
4. **Prompt** — platform-specific instructions (YouTube / TikTok / Reels)
5. **LLM** — OpenAI chat completion (or mock when `MOCK_LLM=true`)
6. **Increment** — atomic quota bump via `increment_ai_usage` RPC
7. **Response** — `{ script, usage, model }`

### Environment

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | For JWT validation |
| `SUPABASE_SERVICE_ROLE_KEY` | For `ai_usage` writes |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `MONTHLY_AI_LIMIT` | Default `8` |
| `MEMORY_STORE` | `true` for in-memory quota (local dev) |
| `MOCK_LLM` | `true` to skip OpenAI (local dev / tests) |

### Supabase migration

Apply `supabase/migrations/20250825000000_ai_usage.sql` to create:

- `ai_usage` table (`user_id`, `month`, `count`, `limit`)
- `increment_ai_usage()` RPC with row lock and limit check

### Development

```bash
cd api
npm install
MEMORY_STORE=true MOCK_LLM=true npm run dev
```

Health check: `GET /health`

### CreatorFlow frontend

Set `VITE_API_URL` to the API origin (no trailing slash), e.g. `http://localhost:3000`.

Local Vite proxy (optional): `/ai` → `http://localhost:3000`.
