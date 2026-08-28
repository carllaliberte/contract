# Supabase Edge Functions

Deploy all CreatorFlow functions:

```bash
bash scripts/deploy-supabase-functions.sh
```

Or manually (from repo root, after `supabase login` or `SUPABASE_ACCESS_TOKEN`):

```bash
supabase functions deploy generate-script --no-verify-jwt
supabase functions deploy generate-poster --no-verify-jwt
supabase functions deploy auth-apple --no-verify-jwt
supabase functions deploy health --no-verify-jwt
supabase secrets set \
  XAI_API_KEY=<your-xai-api-key> \
  XAI_MODEL=grok-4.5 \
  XAI_IMAGE_MODEL=grok-imagine-image-2.0 \
  APPLE_CLIENT_ID=com.carllaliberte.creatorflow
```

## Client URLs

| Function | URL |
|----------|-----|
| `generate-script` | `https://YOUR_PROJECT.supabase.co/functions/v1/generate-script` |
| `generate-poster` | `https://YOUR_PROJECT.supabase.co/functions/v1/generate-poster` |
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
