#!/usr/bin/env bash
# Prepare values for GitHub Actions secrets (Google Play release).
# Run locally — never commit keystore or JSON keys to git.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${KEYSTORE_PATH:-$ROOT/google-app/android/release.keystore}"
ALIAS="${ANDROID_KEY_ALIAS:-meta-upload}"

echo "=== META Dashboard — GitHub secrets for Play Store ==="
echo ""
echo "Add these in: https://github.com/carllaliberte/contract/settings/secrets/actions"
echo ""

if [[ ! -f "$KEYSTORE" ]]; then
  echo "No keystore at $KEYSTORE"
  echo "Generate one with:"
  echo "  ANDROID_KEYSTORE_PASSWORD='your-store-pass' ANDROID_KEY_PASSWORD='your-key-pass' bash scripts/generate-android-keystore.sh"
  echo ""
  exit 1
fi

echo "ANDROID_KEYSTORE_BASE64 (copy entire line):"
base64 -w0 "$KEYSTORE" 2>/dev/null || base64 "$KEYSTORE"
echo ""
echo ""
echo "ANDROID_KEY_ALIAS=$ALIAS"
echo "ANDROID_KEYSTORE_PASSWORD=(your store password)"
echo "ANDROID_KEY_PASSWORD=(your key password)"
echo ""
echo "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=(paste full JSON from Google Cloud — see google-app/play-store/LISTING.md)"
echo ""
echo "After saving secrets, trigger CI:"
echo "  https://github.com/carllaliberte/contract/actions/workflows/android-play-release.yml → Run workflow"
