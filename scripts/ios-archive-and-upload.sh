#!/usr/bin/env bash
# Archive CreatorFlow iOS, export IPA locally, then upload to App Store Connect.
#
# Required env:
#   APPLE_TEAM_ID=XXXXXXXXXX
#   APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
#   APP_STORE_CONNECT_API_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#
# API key (.p8) — place at ~/.private_keys/AuthKey_<KEY_ID>.p8, or set:
#   APP_STORE_CONNECT_API_KEY_BASE64=...
#   APP_STORE_CONNECT_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
#
# Usage:
#   bash scripts/ios-archive-and-upload.sh
#   ARCHIVE_ONLY=1 bash scripts/ios-archive-and-upload.sh   # skip upload
#   SKIP_UPLOAD=1 bash scripts/ios-archive-and-upload.sh
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "ERROR: ios-archive-and-upload.sh requires macOS with Xcode."
  echo "Run on your Mac, or trigger .github/workflows/macos-ios-virtual.yml in GitHub Actions."
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

EXPORT_OPTS="$(mktemp /tmp/ExportOptions.XXXXXX.plist)"
trap 'rm -f "$EXPORT_OPTS"' EXIT
cp ExportOptions.plist "$EXPORT_OPTS"
/usr/libexec/PlistBuddy -c "Add :teamID string $APPLE_TEAM_ID" "$EXPORT_OPTS" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :teamID $APPLE_TEAM_ID" "$EXPORT_OPTS"

echo "▶ Export IPA locally (destination=export)"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTS" \
  -allowProvisioningUpdates

if [[ ! -f "$IPA_PATH" ]]; then
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

: "${APP_STORE_CONNECT_API_KEY_ID:?Set APP_STORE_CONNECT_API_KEY_ID}"
: "${APP_STORE_CONNECT_API_ISSUER_ID:?Set APP_STORE_CONNECT_API_ISSUER_ID}"

PRIVATE_KEYS_DIR="${HOME}/.private_keys"
mkdir -p "$PRIVATE_KEYS_DIR"
EXPECTED_KEY="$PRIVATE_KEYS_DIR/AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8"

if [[ ! -f "$EXPECTED_KEY" ]]; then
  if [[ -n "${APP_STORE_CONNECT_API_KEY_BASE64:-}" ]]; then
    echo "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 --decode > "$EXPECTED_KEY"
  elif [[ -n "${APP_STORE_CONNECT_API_KEY_PATH:-}" && -f "$APP_STORE_CONNECT_API_KEY_PATH" ]]; then
    cp "$APP_STORE_CONNECT_API_KEY_PATH" "$EXPECTED_KEY"
  fi
fi

if [[ ! -f "$EXPECTED_KEY" ]]; then
  echo ""
  echo "⚠ Upload skipped — App Store Connect API key not configured."
  echo "  Place AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8 in $PRIVATE_KEYS_DIR"
  echo "  or set APP_STORE_CONNECT_API_KEY_BASE64 / APP_STORE_CONNECT_API_KEY_PATH."
  echo ""
  echo "  Manual upload: open Transporter app or Xcode → Organizer → Distribute"
  echo "  IPA ready at: $IPA_PATH"
  open -R "$IPA_PATH" 2>/dev/null || true
  exit 0
fi

echo "▶ Upload to App Store Connect (iTMSTransporter, fallback altool)"
if xcrun iTMSTransporter -m upload \
  -assetFile "$IPA_PATH" \
  -apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
  -apiIssuer "$APP_STORE_CONNECT_API_ISSUER_ID"; then
  echo "✓ Upload complete via iTMSTransporter."
else
  echo "⚠ iTMSTransporter failed — trying altool..."
  xcrun altool --upload-app \
    --type ios \
    --file "$IPA_PATH" \
    --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
    --apiIssuer "$APP_STORE_CONNECT_API_ISSUER_ID"
  echo "✓ Upload complete via altool."
fi

echo ""
echo "✓ Upload complete. Finish submission in App Store Connect:"
echo "  https://appstoreconnect.apple.com/apps"
open "https://appstoreconnect.apple.com/apps" 2>/dev/null || true
