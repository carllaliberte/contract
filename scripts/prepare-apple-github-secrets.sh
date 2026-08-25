#!/usr/bin/env bash
# Prepare GitHub Actions secrets for iOS App Store upload (virtual Mac CI).
# Run on Mac with your Apple credentials, then paste into GitHub → Settings → Secrets.
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo " Apple secrets → GitHub Actions (virtual Mac CI)"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Required secrets (repo: carllaliberte/contract):"
echo "  APPLE_TEAM_ID"
echo "  APP_STORE_CONNECT_API_KEY_ID"
echo "  APP_STORE_CONNECT_API_ISSUER_ID"
echo "  APP_STORE_CONNECT_API_KEY_BASE64"
echo ""
echo "Optional (manual signing):"
echo "  APPLE_CERTIFICATE_BASE64"
echo "  APPLE_CERTIFICATE_PASSWORD"
echo "  APPLE_PROVISION_PROFILE_BASE64"
echo ""

read -rp "APPLE_TEAM_ID (10 chars): " TEAM_ID
read -rp "Path to AuthKey_XXXXX.p8: " KEY_PATH
read -rp "APP_STORE_CONNECT_API_KEY_ID: " KEY_ID
read -rp "APP_STORE_CONNECT_API_ISSUER_ID: " ISSUER_ID

if [ ! -f "$KEY_PATH" ]; then
  echo "ERROR: Key file not found: $KEY_PATH"
  exit 1
fi

KEY_B64=$(base64 < "$KEY_PATH" | tr -d '\n')

echo ""
echo "── gh CLI commands (run if authenticated as repo owner) ──"
echo ""
echo "gh secret set APPLE_TEAM_ID --repo carllaliberte/contract --body \"$TEAM_ID\""
echo "gh secret set APP_STORE_CONNECT_API_KEY_ID --repo carllaliberte/contract --body \"$KEY_ID\""
echo "gh secret set APP_STORE_CONNECT_API_ISSUER_ID --repo carllaliberte/contract --body \"$ISSUER_ID\""
echo "gh secret set APP_STORE_CONNECT_API_KEY_BASE64 --repo carllaliberte/contract --body \"$KEY_B64\""
echo ""
echo "── Then launch virtual Mac ──"
echo "bash scripts/launch-virtual-mac-ios.sh ios-release/1.0.0"
echo ""
