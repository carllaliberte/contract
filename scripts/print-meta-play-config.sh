#!/usr/bin/env bash
# Build signed AAB on this machine and print ONE JSON for GitHub secret META_PLAY_CONFIG.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="${KEYSTORE_PATH:-$ROOT/google-app/android/release.keystore}"
PLAY_JSON_FILE="${PLAY_JSON_FILE:-play-upload-key.json}"

: "${ANDROID_KEYSTORE_PASSWORD:?Set ANDROID_KEYSTORE_PASSWORD}"
: "${ANDROID_KEY_PASSWORD:?Set ANDROID_KEY_PASSWORD}"
ALIAS="${ANDROID_KEY_ALIAS:-meta-upload}"

if [[ ! -f "$KEYSTORE" ]]; then
  bash "$ROOT/scripts/generate-android-keystore.sh" "$KEYSTORE"
fi

if [[ ! -f "$PLAY_JSON_FILE" ]]; then
  echo "Missing $PLAY_JSON_FILE (Google Cloud service account JSON)"
  exit 1
fi

B64="$(base64 -w0 "$KEYSTORE" 2>/dev/null || base64 "$KEYSTORE" | tr -d '\n')"
PLAY_JSON="$(cat "$PLAY_JSON_FILE")"

node -e "
const fs = require('fs');
const cfg = {
  keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
  keyPassword: process.env.ANDROID_KEY_PASSWORD,
  keyAlias: process.env.ANDROID_KEY_ALIAS || 'meta-upload',
  keystoreBase64: fs.readFileSync('$KEYSTORE', 'utf8') ? require('child_process').execSync('base64 -w0 \"$KEYSTORE\" 2>/dev/null || base64 \"$KEYSTORE\" | tr -d \"\\n\"').toString() : '',
  playServiceAccountJson: JSON.parse(fs.readFileSync('$PLAY_JSON_FILE', 'utf8'))
};
console.log(JSON.stringify(cfg));
"

echo ""
echo "Copy ALL JSON above → GitHub secret Name: META_PLAY_CONFIG"
