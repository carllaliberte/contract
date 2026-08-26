#!/usr/bin/env bash
# Push public VITE_* values to GitHub Actions Variables (never commit real keys).
# Requires: gh auth login with repo admin.
#
# Usage:
#   bash scripts/setup-github-ci-env.sh           # set vars from local .env / deployment.json
#   bash scripts/setup-github-ci-env.sh --dry-run # preview only
#
# Reads (in order): creatorflow/.env.local, creatorflow/.env, google-app/.env.local, google-app/.env
# Falls back to google-app/deployment.json for VITE_CONTRACT_ADDRESS / VITE_RPC_URL.
#
# Environment:
#   GITHUB_REPO=owner/repo   (default: carllaliberte/contract)
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      sed -n '2,14p' "$0" | tail -n +2
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

if ! command -v gh &>/dev/null; then
  echo "Missing gh CLI — https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null 2>&1; then
  echo "Run: gh auth login"
  exit 1
fi

# shellcheck source=/dev/null
load_dotenv() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

load_dotenv "$ROOT/creatorflow/.env.local"
load_dotenv "$ROOT/creatorflow/.env"
load_dotenv "$ROOT/google-app/.env.local"
load_dotenv "$ROOT/google-app/.env"

if [[ -z "${VITE_CONTRACT_ADDRESS:-}" || -z "${VITE_RPC_URL:-}" ]] && [[ -f "$ROOT/google-app/deployment.json" ]]; then
  read -r VITE_CONTRACT_ADDRESS VITE_RPC_URL < <(
    node -pe "
const d = require('$ROOT/google-app/deployment.json');
console.log([d.contractAddress || '', d.rpcUrl || ''].join(' '));
"
  )
fi

set_var() {
  local name="$1" value="$2"
  if [[ -z "$value" ]]; then
    echo "Skip (empty): $name"
    return 0
  fi
  if $DRY_RUN; then
    echo "[dry-run] gh variable set $name --repo $REPO"
  else
    gh variable set "$name" --repo "$REPO" --body "$value"
    echo "Set variable: $name"
  fi
}

echo "=== GitHub Actions variables on $REPO ==="
echo "Settings: https://github.com/$REPO/settings/secrets/actions"
echo ""

set_var VITE_API_URL "${VITE_API_URL:-}"
set_var VITE_SUPABASE_URL "${VITE_SUPABASE_URL:-}"
set_var VITE_SUPABASE_ANON_KEY "${VITE_SUPABASE_ANON_KEY:-}"
set_var VITE_WALLETCONNECT_PROJECT_ID "${VITE_WALLETCONNECT_PROJECT_ID:-}"
set_var VITE_CONTRACT_ADDRESS "${VITE_CONTRACT_ADDRESS:-}"
set_var VITE_RPC_URL "${VITE_RPC_URL:-}"

echo ""
echo "Done. Verify:"
echo "  bash scripts/print-ci-secrets-checklist.sh"
