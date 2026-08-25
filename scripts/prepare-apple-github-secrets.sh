#!/usr/bin/env bash
# Prepare GitHub Actions secrets for iOS App Store upload (virtual Mac CI).
# Run on Mac with your Apple credentials, then paste into GitHub → Settings → Secrets.
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo " Apple secrets → GitHub Actions (virtual Mac CI)"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Recommended — ONE secret (like META_PLAY_CONFIG for Android):"
echo "  CREATORFLOW_APPLE_CONFIG"
echo ""
echo "Legacy — individual secrets also supported:"
echo "  APPLE_TEAM_ID, APP_STORE_CONNECT_API_KEY_ID,"
echo "  APP_STORE_CONNECT_API_ISSUER_ID, APP_STORE_CONNECT_API_KEY_BASE64"
echo ""
echo "On Mac with your .p8 key:"
echo "  export APPLE_TEAM_ID=XXXXXXXXXX"
echo "  export APP_STORE_CONNECT_API_KEY_ID=..."
echo "  export APP_STORE_CONNECT_API_ISSUER_ID=..."
echo "  bash scripts/print-creatorflow-apple-config.sh"
echo ""
echo "Then paste JSON into GitHub:"
echo "  gh secret set CREATORFLOW_APPLE_CONFIG --repo carllaliberte/contract"
echo ""
echo "Launch virtual Mac (GitHub-hosted macOS runner):"
echo "  bash scripts/launch-virtual-mac-ios.sh ios-release/1.0.0"
echo ""
