#!/usr/bin/env bash
# Upload a signed AAB to Google Play (internal testing track).
# Credentials: META_PLAY_CONFIG env var OR META_PLAY_CONFIG.json in cwd.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AAB="${1:-}"
CONFIG_FILE="${META_PLAY_CONFIG_FILE:-META_PLAY_CONFIG.json}"
PACKAGE="${PLAY_PACKAGE_NAME:-com.carllaliberte.meta}"
TRACK="${PLAY_TRACK:-internal}"

if [[ -z "$AAB" ]]; then
  AAB="$(ls -1 "$ROOT/google-app/android/app/build/outputs/bundle/release/"*.aab 2>/dev/null | head -1 || true)"
fi
if [[ -z "$AAB" || ! -f "$AAB" ]]; then
  echo "Usage: $0 /path/to/app-release.aab"
  echo "Or build first: npm run build:android in google-app/"
  exit 1
fi

if [[ -n "${META_PLAY_CONFIG:-}" ]]; then
  CFG_JSON="$META_PLAY_CONFIG"
elif [[ -f "$CONFIG_FILE" ]]; then
  CFG_JSON="$(cat "$CONFIG_FILE")"
elif [[ -f "$ROOT/$CONFIG_FILE" ]]; then
  CFG_JSON="$(cat "$ROOT/$CONFIG_FILE")"
elif [[ -f play-upload-key.json ]]; then
  echo "Found play-upload-key.json but no META_PLAY_CONFIG — run cloud-shell-play-setup.sh first"
  exit 1
else
  echo "Missing META_PLAY_CONFIG env var or $CONFIG_FILE"
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

node -e "
const fs = require('fs');
const c = JSON.parse(process.argv[1]);
const keystore = Buffer.from(c.keystoreBase64, 'base64');
fs.writeFileSync(process.argv[2], keystore);
const play =
  typeof c.playServiceAccountJson === 'string'
    ? c.playServiceAccountJson
    : JSON.stringify(c.playServiceAccountJson);
fs.writeFileSync(process.argv[3], play);
" "$CFG_JSON" "$TMP/release.keystore" "$TMP/play-sa.json"

echo "=== Upload $AAB → Play ($TRACK) ==="
npx --yes @r0adkll/upload-google-play@1 \
  --serviceAccountJsonPlainText "$(cat "$TMP/play-sa.json")" \
  --packageName "$PACKAGE" \
  --releaseFiles "$AAB" \
  --track "$TRACK" \
  --status completed

echo "Upload complete — Play Console → Testing → Internal testing"
