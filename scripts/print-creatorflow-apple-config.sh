#!/usr/bin/env bash
# Build ONE JSON for GitHub secret CREATORFLOW_APPLE_CONFIG (virtual Mac iOS archive + upload).
set -euo pipefail

: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID (10-char Team ID)}"
: "${APP_STORE_CONNECT_API_KEY_ID:?Set APP_STORE_CONNECT_API_KEY_ID}"
: "${APP_STORE_CONNECT_API_ISSUER_ID:?Set APP_STORE_CONNECT_API_ISSUER_ID}"

KEY_PATH="${APP_STORE_CONNECT_API_KEY_PATH:-}"
if [[ -z "$KEY_PATH" ]]; then
  read -rp "Path to AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8: " KEY_PATH
fi
[[ -f "$KEY_PATH" ]] || { echo "ERROR: Key not found: $KEY_PATH"; exit 1; }

KEY_B64="$(base64 -w0 "$KEY_PATH" 2>/dev/null || base64 < "$KEY_PATH" | tr -d '\n')"

CERT_B64="${APPLE_CERTIFICATE_BASE64:-}"
CERT_PASS="${APPLE_CERTIFICATE_PASSWORD:-}"
PROFILE_B64="${APPLE_PROVISION_PROFILE_BASE64:-}"

if [[ -n "${APPLE_CERTIFICATE_PATH:-}" && -f "$APPLE_CERTIFICATE_PATH" ]]; then
  CERT_B64="$(base64 -w0 "$APPLE_CERTIFICATE_PATH" 2>/dev/null || base64 < "$APPLE_CERTIFICATE_PATH" | tr -d '\n')"
fi
if [[ -n "${APPLE_PROVISION_PROFILE_PATH:-}" && -f "$APPLE_PROVISION_PROFILE_PATH" ]]; then
  PROFILE_B64="$(base64 -w0 "$APPLE_PROVISION_PROFILE_PATH" 2>/dev/null || base64 < "$APPLE_PROVISION_PROFILE_PATH" | tr -d '\n')"
fi

node -e "
console.log(JSON.stringify({
  teamId: process.env.APPLE_TEAM_ID,
  apiKeyId: process.env.APP_STORE_CONNECT_API_KEY_ID,
  apiIssuerId: process.env.APP_STORE_CONNECT_API_ISSUER_ID,
  apiKeyBase64: process.env.KEY_B64,
  certificateBase64: process.env.CERT_B64 || '',
  certificatePassword: process.env.CERT_PASS || '',
  provisionProfileBase64: process.env.PROFILE_B64 || ''
}, null, 2));
" KEY_B64="$KEY_B64" CERT_B64="$CERT_B64" CERT_PASS="$CERT_PASS" PROFILE_B64="$PROFILE_B64"

echo ""
echo "Copy ALL JSON above → GitHub secret Name: CREATORFLOW_APPLE_CONFIG"
echo "Then tag: git tag ios-release-v1.0.0 && git push origin ios-release-v1.0.0"
