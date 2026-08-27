# Supabase Edge Functions

Deploy all CreatorFlow functions:

```bash
bash scripts/deploy-supabase-functions.sh
```

Or manually (from repo root, after `supabase login` or `SUPABASE_ACCESS_TOKEN`):

```bash
supabase functions deploy generate-script --no-verify-jwt
supabase functions deploy auth-apple --no-verify-jwt
supabase functions deploy health --no-verify-jwt
supabase secrets set \
  OPENAI_API_KEY=<your-openai-api-key> \
  APPLE_CLIENT_ID=com.carllaliberte.creatorflow
```

## Client URLs

| Function | URL |
|----------|-----|
| `generate-script` | `https://YOUR_PROJECT.supabase.co/functions/v1/generate-script` |
| `auth-apple` | `https://YOUR_PROJECT.supabase.co/functions/v1/auth-apple` |
| `health` | `https://YOUR_PROJECT.supabase.co/functions/v1/health` |

CreatorFlow env:

```env
VITE_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1/generate-script
VITE_AUTH_APPLE_URL=https://YOUR_PROJECT.supabase.co/functions/v1/auth-apple
```

Settings pings `.../functions/v1/health` automatically when `VITE_API_URL` points at Supabase.

## Apple provider (Dashboard)

Enable **Sign in with Apple** in Supabase Auth providers and add `com.carllaliberte.creatorflow` to Client IDs (native App ID).
