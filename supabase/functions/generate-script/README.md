# Supabase Edge Function: generate-script

Deploy:

```bash
bash scripts/deploy-supabase-functions.sh
```

Or:

```bash
supabase functions deploy generate-script --no-verify-jwt
supabase functions deploy auth-apple --no-verify-jwt
supabase functions deploy health --no-verify-jwt
```

Set secrets in Supabase (never commit):

```bash
supabase secrets set XAI_API_KEY=<your-xai-api-key> APPLE_CLIENT_ID=com.carllaliberte.creatorflow
# optional
supabase secrets set XAI_MODEL=grok-4.5
```

Client `VITE_API_URL`:

```
https://YOUR_PROJECT.supabase.co/functions/v1/generate-script
```

Contract: `POST` with JSON body matching `GenerateScriptRequest`, response `GenerateScriptResponse`.

Auth: `Authorization: Bearer <supabase_jwt>` or `x-demo-id` for demo mode.

Optional body: `sourceUrl` (public http/https) and/or `sourceText` — Grok grounds the script in that open source.
YouTube URLs use oEmbed (title + author). Wikipedia URLs use the REST summary. Other pages stay HTML→text.

Response pack: `script`, `titles` (3), `description`, `hashtags`, `hooks` (3). If Grok is not configured, `message` is `GROK_NOT_CONFIGURED` (not `OPENAI_API_KEY`).

Limits: free = 8/month, pro = 200/month (from `profiles.plan`).
