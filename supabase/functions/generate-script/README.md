# Supabase Edge Function: generate-script

Deploy:

```bash
supabase functions deploy generate-script --no-verify-jwt
```

Set secrets in Supabase (never commit):

```bash
supabase secrets set OPENAI_API_KEY=sk-...
# optional
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

Client `VITE_API_URL`:

```
https://YOUR_PROJECT.supabase.co/functions/v1/generate-script
```

Contract: `POST` with JSON body matching `GenerateScriptRequest`, response `GenerateScriptResponse`.

Auth: `Authorization: Bearer <supabase_jwt>` or `x-demo-id` for demo mode.

Limits: free = 8/month, pro = 200/month (from `profiles.plan`).
