#!/usr/bin/env bash
# Checklist: GitHub Actions Variables vs Secrets for carllaliberte/contract.
# Safe to run anytime — never prints secret values.
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }

has_gh=false
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  has_gh=true
fi

repo_var_set() {
  local name="$1"
  $has_gh && gh variable list --repo "$REPO" --json name -q ".[] | select(.name==\"$name\") | .name" 2>/dev/null | grep -qx "$name"
}

repo_var_value() {
  local name="$1"
  $has_gh && gh variable get "$name" --repo "$REPO" 2>/dev/null || true
}

repo_secret_set() {
  local name="$1"
  $has_gh && gh secret list --repo "$REPO" --json name -q ".[] | select(.name==\"$name\") | .name" 2>/dev/null | grep -qx "$name"
}

status_var() {
  local name="$1"
  if repo_var_set "$name"; then
    green "  [set]     $name"
  else
    dim "  [optional] $name"
  fi
}

status_secret() {
  local name="$1" note="$2"
  if repo_secret_set "$name"; then
    green "  [set]     $name"
  else
    dim "  [optional] $name — $note"
  fi
}

bold "=== GitHub Actions — Variables vs Secrets ($REPO) ==="
echo ""
echo "Settings → Secrets and variables → Actions:"
echo "  https://github.com/$REPO/settings/secrets/actions"
echo "Docs: docs/CI_SECRETS_SETUP.md"
echo ""

if ! $has_gh; then
  yellow "gh CLI not authenticated — cannot detect remote state."
  echo ""
fi

bold "Variables (public VITE_* — injected at build, visible in client bundle)"
status_var VITE_API_URL
status_var VITE_WALLETCONNECT_PROJECT_ID
status_var VITE_CONTRACT_ADDRESS
status_var VITE_RPC_URL
echo ""
dim "  Do NOT set VITE_BASE_PATH=/ — GitHub Pages needs /contract/ (META)"
dim "    and /contract/creatorflow/ (CreatorFlow); workflows set these paths."
dim "  Do NOT add OPENAI_API_KEY here — server-side only (Supabase Edge / API host)."
echo ""

bold "Secrets (private — signing, Play, Firebase, Apple)"
status_secret CREATORFLOW_APPLE_CONFIG "iOS archive + App Store upload (virtual Mac CI)"
status_secret META_PLAY_CONFIG "Play upload: keystore + service account JSON (recommended)"
status_secret FIREBASE_TOKEN "Firebase Hosting deploy (skip if absent)"
status_secret ANDROID_KEYSTORE_BASE64 "legacy Play signing — prefer META_PLAY_CONFIG"
status_secret GOOGLE_PLAY_SERVICE_ACCOUNT_JSON "legacy Play API — prefer META_PLAY_CONFIG or WIF"
echo ""
dim "  Play: prefer META_PLAY_CONFIG over legacy ANDROID_KEYSTORE_* / GOOGLE_PLAY_SERVICE_ACCOUNT_JSON."
dim "  OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY → Supabase / API host, not GitHub Actions."
echo ""

bold "Workflows — secrets required?"
echo "  CI CreatorFlow / API CI / Secret scan  → none"
echo "  Deploy CreatorFlow                     → optional VITE_API_URL (variable)"
echo "  Deploy META dashboard                  → optional VITE_* variables"
echo "  Build Android release (Google Play)    → META_PLAY_CONFIG (or upload skipped)"
echo "  macOS iOS build (virtual Mac)          → CREATORFLOW_APPLE_CONFIG (or archive skipped)"
echo ""

bold "Configure"
echo "  bash scripts/setup-github-ci-env.sh              # push VITE_* variables"
echo "  bash scripts/print-meta-play-config.sh           # build META_PLAY_CONFIG JSON locally"
echo "  bash scripts/print-creatorflow-apple-config.sh   # build CREATORFLOW_APPLE_CONFIG JSON"
echo "  bash scripts/apply-github-secrets.sh             # legacy Play keystore secrets"
echo "  gh secret set META_PLAY_CONFIG --repo $REPO      # paste JSON (admin only)"
echo ""

if $has_gh; then
  bad_base=""
  if repo_var_set VITE_BASE_PATH; then
    val="$(repo_var_value VITE_BASE_PATH)"
    if [[ "$val" == "/" ]]; then
      bad_base=yes
    fi
  fi
  if [[ -n "$bad_base" ]]; then
    red "Warning: VITE_BASE_PATH=/ breaks GitHub Pages asset paths — remove or set /contract/."
  fi

  if repo_secret_set OPENAI_API_KEY; then
    red "Warning: OPENAI_API_KEY should not be a GitHub Actions secret — use Supabase/API host."
  fi

  if repo_secret_set VITE_WALLETCONNECT_PROJECT_ID; then
    yellow "Legacy: VITE_WALLETCONNECT_PROJECT_ID is a secret — migrate to a variable (public WC project ID)."
  fi

  if repo_secret_set META_PLAY_CONFIG; then
    green "Play upload: META_PLAY_CONFIG is set."
  else
    yellow "Play upload: META_PLAY_CONFIG not set — AAB builds but Play upload is skipped."
  fi

  if repo_secret_set CREATORFLOW_APPLE_CONFIG || repo_secret_set APPLE_TEAM_ID; then
    green "iOS: Apple credentials configured (virtual Mac can archive + upload)."
  else
    yellow "iOS: CREATORFLOW_APPLE_CONFIG not set — simulator build only, no App Store upload."
  fi
fi
