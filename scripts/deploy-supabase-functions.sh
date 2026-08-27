#!/usr/bin/env bash
# Deploy CreatorFlow Supabase Edge Functions.
#
# Prerequisites:
#   supabase login   OR   export SUPABASE_ACCESS_TOKEN=...
#   supabase link --project-ref YOUR_PROJECT_REF
#
# Usage:
#   bash scripts/deploy-supabase-functions.sh
#   OPENAI_API_KEY=sk-... bash scripts/deploy-supabase-functions.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${SUPABASE_CLI:-$ROOT/.bin/supabase}"
if [[ ! -x "$CLI" ]]; then
  CLI="$(command -v supabase || true)"
fi

if [[ -z "$CLI" ]]; then
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

cd "$ROOT"

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Link project first: supabase link --project-ref YOUR_PROJECT_REF"
  exit 1
fi

echo "=== Deploying Edge Functions ==="
"$CLI" functions deploy generate-script --no-verify-jwt
"$CLI" functions deploy auth-apple --no-verify-jwt
"$CLI" functions deploy health --no-verify-jwt

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  echo "=== Setting secrets ==="
  "$CLI" secrets set \
    "OPENAI_API_KEY=${OPENAI_API_KEY}" \
    "APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-com.carllaliberte.creatorflow}"
else
  echo "Skip secrets (set OPENAI_API_KEY env to configure):"
  echo "  supabase secrets set OPENAI_API_KEY=... APPLE_CLIENT_ID=com.carllaliberte.creatorflow"
fi

echo "Done."
