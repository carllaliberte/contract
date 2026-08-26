#!/usr/bin/env bash
# Archive CreatorFlow iOS and upload to App Store Connect (macOS + Xcode required).
#
# Required env (App Store Connect API key — recommended):
#   APPLE_TEAM_ID=XXXXXXXXXX
#   APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
#   APP_STORE_CONNECT_API_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#   APP_STORE_CONNECT_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
#
# Or decode key from base64:
#   APP_STORE_CONNECT_API_KEY_BASE64=...
#
# Usage:
#   bash scripts/ios-archive-and-upload.sh
#   ARCHIVE_ONLY=1 bash scripts/ios-archive-and-upload.sh   # skip upload
#   SKIP_UPLOAD=1 bash scripts/ios-archive-and-upload.sh
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "ERROR: ios-archive-and-upload.sh requires macOS with Xcode."
  echo "Run on your Mac, or trigger .github/workflows/ios-app-store-release.yml in GitHub Actions."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/creatorflow/ios/App"
SCHEME="${IOS_SCHEME:-App}"
CONFIG="${IOS_CONFIGURATION:-Release}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT/creatorflow/ios/build/CreatorFlow.xcarchive}"
EXPORT_DIR="${EXPORT_DIR:-$ROOT/creatorflow/ios/build/export}"
IPA_PATH="$EXPORT_DIR/App.ipa"

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_DIR"

if [[ -z "${APPLE_TEAM_ID:-}" ]]; then
  echo "ERROR: Set APPLE_TEAM_ID (10-char Team ID from Apple Developer)."
  exit 1
fi

echo "▶ Archive — scheme=$SCHEME configuration=$CONFIG team=$APPLE_TEAM_ID"
cd "$IOS_DIR"

xcodebuild archive \
  -project App.xcodeproj \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates

echo "▶ Export IPA for App Store Connect"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist ExportOptions.plist \
  -allowProvisioningUpdates

if [[ ! -f "$IPA_PATH" ]]; then
  # Xcode may name the ipa after the target
  IPA_PATH="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)"
fi

if [[ ! -f "$IPA_PATH" ]]; then
  echo "ERROR: IPA not found in $EXPORT_DIR"
  exit 1
fi

echo "✓ IPA: $IPA_PATH"

if [[ "${ARCHIVE_ONLY:-}" == "1" || "${SKIP_UPLOAD:-}" == "1" ]]; then
  echo "Skipping upload (ARCHIVE_ONLY or SKIP_UPLOAD set)."
  exit 0
fi

# Resolve API key path
KEY_PATH="${APP_STORE_CONNECT_API_KEY_PATH:-}"
if [[ -z "$KEY_PATH" && -n "${APP_STORE_CONNECT_API_KEY_BASE64:-}" ]]; then
  KEY_PATH="$(mktemp /tmp/AuthKey.XXXXXX.p8)"
  echo "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 --decode > "$KEY_PATH"
  trap 'rm -f "$KEY_PATH"' EXIT
fi

if [[ -z "$KEY_PATH" || ! -f "$KEY_PATH" ]]; then
  echo ""
  echo "⚠ Upload skipped — App Store Connect API key not configured."
  echo "  Set APP_STORE_CONNECT_API_KEY_ID, APP_STORE_CONNECT_API_ISSUER_ID,"
  echo "  and APP_STORE_CONNECT_API_KEY_PATH (or _BASE64)."
  echo ""
  echo "  Manual upload: open Transporter app or Xcode → Organizer → Distribute"
  echo "  IPA ready at: $IPA_PATH"
  open -R "$IPA_PATH" 2>/dev/null || true
  exit 0
fi

: "${APP_STORE_CONNECT_API_KEY_ID:?Set APP_STORE_CONNECT_API_KEY_ID}"
: "${APP_STORE_CONNECT_API_ISSUER_ID:?Set APP_STORE_CONNECT_API_ISSUER_ID}"

echo "▶ Upload to App Store Connect"
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
  --apiIssuer "$APP_STORE_CONNECT_API_ISSUER_ID" \
  --apiKeyPath "$KEY_PATH"

echo ""
echo "✓ Upload complete. Finish submission in App Store Connect:"
echo "  https://appstoreconnect.apple.com/apps"
open "https://appstoreconnect.apple.com/apps" 2>/dev/null || true
