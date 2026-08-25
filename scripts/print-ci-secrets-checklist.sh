#!/usr/bin/env bash
# Print a checklist of GitHub Actions variables & secrets for carllaliberte/contract.
# Safe to run anytime — does not print secret values.
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

have_gh=false
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  have_gh=true
fi

var_status() {
  local name="$1"
  if [[ "$have_gh" != true ]]; then
    echo "?"
    return
  fi
  if gh variable list --repo "$REPO" --json name -q ".[] | select(.name==\"$name\") | .name" 2>/dev/null | grep -qx "$name"; then
    echo "set"
  else
    echo "missing"
  fi
}

secret_status() {
  local name="$1"
  if [[ "$have_gh" != true ]]; then
    echo "?"
    return
  fi
  if gh secret list --repo "$REPO" --json name -q ".[] | select(.name==\"$name\") | .name" 2>/dev/null | grep -qx "$name"; then
    echo "set"
  else
    echo "missing"
  fi
}

print_row() {
  local kind="$1" name="$2" required="$3" note="$4" status="$5"
  printf "  %-8s %-36s %-11s [%s] %s\n" "$kind" "$name" "$required" "$status" "$note"
}

echo "=== CI variables & secrets checklist — $REPO ==="
echo ""
echo "Settings: https://github.com/$REPO/settings/secrets/actions"
echo "Apply public vars:  bash scripts/setup-github-ci-env.sh"
echo "Apply Play secrets: bash scripts/apply-github-secrets.sh"
echo ""

if [[ "$have_gh" != true ]]; then
  echo "(Install and authenticate gh CLI to see live set/missing status.)"
  echo ""
fi

echo "--- Variables (public at build — use vars, not secrets) ---"
print_row "var" "VITE_API_URL" "optional" "CreatorFlow AI endpoint" "$(var_status VITE_API_URL)"
print_row "var" "VITE_WALLETCONNECT_PROJECT_ID" "optional" "META WalletConnect project ID" "$(var_status VITE_WALLETCONNECT_PROJECT_ID)"
print_row "var" "VITE_CONTRACT_ADDRESS" "optional" "META contract (or deployment.json)" "$(var_status VITE_CONTRACT_ADDRESS)"
print_row "var" "VITE_RPC_URL" "optional" "META JSON-RPC URL" "$(var_status VITE_RPC_URL)"
print_row "var" "VITE_BASE_PATH" "optional" "META Pages base (workflow default /contract/)" "$(var_status VITE_BASE_PATH)"
echo ""
echo "  Note: CreatorFlow deploy hard-codes VITE_BASE_PATH=/contract/creatorflow/ in its workflow."
echo "  Do not set VITE_BASE_PATH=/ globally — it would break GitHub Pages routing."
echo ""

echo "--- Secrets (never in client bundle) ---"
print_row "secret" "FIREBASE_TOKEN" "optional" "Firebase Hosting deploy (skip if absent)" "$(secret_status FIREBASE_TOKEN)"
print_row "secret" "META_PLAY_CONFIG" "optional" "Play upload JSON bundle" "$(secret_status META_PLAY_CONFIG)"
print_row "secret" "ANDROID_KEYSTORE_BASE64" "optional" "Android signing" "$(secret_status ANDROID_KEYSTORE_BASE64)"
print_row "secret" "ANDROID_KEYSTORE_PASSWORD" "optional" "Android signing" "$(secret_status ANDROID_KEYSTORE_PASSWORD)"
print_row "secret" "ANDROID_KEY_ALIAS" "optional" "Android signing" "$(secret_status ANDROID_KEY_ALIAS)"
print_row "secret" "ANDROID_KEY_PASSWORD" "optional" "Android signing" "$(secret_status ANDROID_KEY_PASSWORD)"
print_row "secret" "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" "optional" "Play API (or WIF)" "$(secret_status GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)"
print_row "secret" "VITE_WALLETCONNECT_PROJECT_ID" "legacy" "prefer variable — migrate if present" "$(secret_status VITE_WALLETCONNECT_PROJECT_ID)"
echo ""

echo "--- Local env templates (copy, fill, never commit) ---"
for f in \
  "$ROOT/creatorflow/.env.example" \
  "$ROOT/google-app/.env.example" \
  "$ROOT/api/.env.example"; do
  if [[ -f "$f" ]]; then
    echo "  $f"
  fi
done
echo ""

echo "--- CI without secrets ---"
echo "  api-ci.yml          MEMORY_STORE + MOCK_LLM (no API keys required)"
echo "  ci-creatorflow.yml  no repository secrets required"
echo "  deploy-creatorflow  only VITE_API_URL var optional"
echo ""

echo "Full reference: docs/CI_SECRETS_SETUP.md"
