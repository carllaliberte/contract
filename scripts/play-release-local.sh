#!/usr/bin/env bash
# Build signed AAB locally and upload to Google Play internal track.
# Requires env vars (Cursor environment secrets or export manually):
#   ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
#   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

need() { echo "Missing: $1"; exit 1; }

for v in ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD GOOGLE_PLAY_SERVICE_ACCOUNT_JSON; do
  if [ -z "${!v:-}" ]; then need "$v"; fi
done

echo "=== Build web + Android ==="
cd google-app
npm ci
npm run generate-icons
if [ -f deployment.json ]; then
  export VITE_CONTRACT_ADDRESS=$(node -pe "JSON.parse(require('fs').readFileSync('deployment.json')).contractAddress")
  export VITE_RPC_URL=$(node -pe "JSON.parse(require('fs').readFileSync('deployment.json')).rpcUrl")
fi
npm run build:android
npx cap sync android

echo "=== Sign and bundle ==="
cd android
echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > release.keystore
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file="$PWD/release.keystore" \
  -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD"

AAB="$(ls -1 app/build/outputs/bundle/release/*.aab | head -1)"
echo "AAB: $AAB"

echo "=== Upload to Play (internal) ==="
PLAY_JSON_FILE="$(mktemp)"
printf '%s' "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" > "$PLAY_JSON_FILE"

# Use upload-google-play via npx (same as CI)
npx --yes @r0adkll/upload-google-play@1 \
  --serviceAccountJsonPlainText "$(cat "$PLAY_JSON_FILE")" \
  --packageName com.carllaliberte.meta \
  --releaseFiles "$AAB" \
  --track internal \
  --status completed

rm -f "$PLAY_JSON_FILE" release.keystore
echo "Upload complete — check Play Console → Testing → Internal testing"
