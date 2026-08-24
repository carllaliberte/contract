#!/usr/bin/env bash
# Apply GitHub Actions secrets for Play Store CI.
# Requires: gh auth with repo secrets permission (repo admin or custom PAT).
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${KEYSTORE_PATH:-$ROOT/google-app/android/release.keystore}"

need() { echo "Missing: $1"; exit 1; }

if ! command -v gh &>/dev/null; then
  need "gh CLI — install https://cli.github.com/"
fi

# Keystore secrets
if [[ -f "$KEYSTORE" ]]; then
  ANDROID_KEYSTORE_BASE64="$(base64 -w0 "$KEYSTORE" 2>/dev/null || base64 "$KEYSTORE")"
  ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-meta-upload}"
  : "${ANDROID_KEYSTORE_PASSWORD:?Set ANDROID_KEYSTORE_PASSWORD}"
  : "${ANDROID_KEY_PASSWORD:?Set ANDROID_KEY_PASSWORD}"
else
  echo "No keystore at $KEYSTORE — generate first:"
  echo "  bash scripts/generate-android-keystore.sh"
  exit 1
fi

# Play JSON: file path or env var
if [[ -n "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}" ]]; then
  PLAY_JSON="$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
elif [[ -n "${PLAY_KEY_FILE:-}" && -f "$PLAY_KEY_FILE" ]]; then
  PLAY_JSON="$(cat "$PLAY_KEY_FILE")"
elif [[ -f play-upload-key.json ]]; then
  PLAY_JSON="$(cat play-upload-key.json)"
else
  need "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON or PLAY_KEY_FILE or play-upload-key.json"
fi

echo "Setting secrets on $REPO ..."
gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO" --body "$ANDROID_KEYSTORE_BASE64"
gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO" --body "$ANDROID_KEYSTORE_PASSWORD"
gh secret set ANDROID_KEY_ALIAS --repo "$REPO" --body "$ANDROID_KEY_ALIAS"
gh secret set ANDROID_KEY_PASSWORD --repo "$REPO" --body "$ANDROID_KEY_PASSWORD"
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON --repo "$REPO" --body "$PLAY_JSON"

echo "Done. Trigger workflow:"
echo "  gh workflow run android-play-release.yml --repo $REPO --ref main"
