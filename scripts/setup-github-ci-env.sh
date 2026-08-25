#!/usr/bin/env bash
# Push public GitHub Actions *variables* (VITE_*) for CI builds.
# Reads from the environment or local .env files — never commit real values.
# Requires: gh auth with repo admin (or PAT with variables:write).
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

need() { echo "Missing: $1"; exit 1; }

if ! command -v gh &>/dev/null; then
  need "gh CLI — install https://cli.github.com/"
fi

# Read KEY=VALUE from a dotenv file (first match wins; ignores comments and blanks).
read_env_file() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 0
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | head -n1 || true)"
  [[ -n "$line" ]] || return 0
  line="${line#*=}"
  # Trim optional surrounding quotes
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

# Resolve value: env var wins, then creatorflow/.env, then google-app/.env.
resolve_var() {
  local key="$1"
  local val="${!key:-}"
  if [[ -z "$val" ]]; then
    val="$(read_env_file "$ROOT/creatorflow/.env" "$key")"
  fi
  if [[ -z "$val" ]]; then
    val="$(read_env_file "$ROOT/creatorflow/.env.local" "$key")"
  fi
  if [[ -z "$val" ]]; then
    val="$(read_env_file "$ROOT/google-app/.env" "$key")"
  fi
  if [[ -z "$val" ]]; then
    val="$(read_env_file "$ROOT/google-app/.env.local" "$key")"
  fi
  # Trim whitespace
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  printf '%s' "$val"
}

set_var_if_nonempty() {
  local key="$1"
  local val
  val="$(resolve_var "$key")"
  if [[ -z "$val" ]]; then
    echo "skip $key (empty — export it or add to creatorflow/.env / google-app/.env)"
    return 0
  fi
  echo "set  $key on $REPO"
  gh variable set "$key" --repo "$REPO" --body "$val"
}

echo "=== GitHub Actions variables (public VITE_*) on $REPO ==="
echo "Source order: shell env → creatorflow/.env → google-app/.env"
echo ""

set_var_if_nonempty VITE_API_URL
set_var_if_nonempty VITE_WALLETCONNECT_PROJECT_ID
set_var_if_nonempty VITE_CONTRACT_ADDRESS
set_var_if_nonempty VITE_RPC_URL

echo ""
echo "Done. Verify:"
echo "  gh variable list --repo $REPO"
echo "Checklist:"
echo "  bash scripts/print-ci-secrets-checklist.sh"
echo "Docs:"
echo "  docs/CI_SECRETS_SETUP.md"
