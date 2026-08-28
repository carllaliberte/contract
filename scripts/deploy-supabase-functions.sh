#!/usr/bin/env bash
# Deploy CreatorFlow Supabase Edge Functions.
#
# Prerequisites:
#   supabase login   OR   export SUPABASE_ACCESS_TOKEN=...
#   supabase link --project-ref YOUR_PROJECT_REF
#
# Usage:
#   bash scripts/deploy-supabase-functions.sh
#   XAI_API_KEY=xai-... bash scripts/deploy-supabase-functions.sh
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
"$CLI" functions deploy generate-poster --no-verify-jwt
"$CLI" functions deploy generate-clip --no-verify-jwt
"$CLI" functions deploy auth-apple --no-verify-jwt
"$CLI" functions deploy health --no-verify-jwt

if [[ -n "${XAI_API_KEY:-}" ]]; then
  echo "=== Setting secrets ==="
  "$CLI" secrets set \
    "XAI_API_KEY=${XAI_API_KEY}" \
    "XAI_MODEL=${XAI_MODEL:-grok-4.5}" \
    "XAI_IMAGE_MODEL=${XAI_IMAGE_MODEL:-grok-imagine-image-2.0}" \
    "XAI_VIDEO_MODEL=${XAI_VIDEO_MODEL:-grok-imagine-video-1.5}" \
    "APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-com.carllaliberte.creatorflow}"
else
  echo "Skip secrets (set XAI_API_KEY env to configure):"
  echo "  supabase secrets set XAI_API_KEY=... XAI_MODEL=grok-4.5 XAI_IMAGE_MODEL=grok-imagine-image-2.0 XAI_VIDEO_MODEL=grok-imagine-video-1.5 APPLE_CLIENT_ID=com.carllaliberte.creatorflow"
fi

echo "Done."
