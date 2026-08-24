#!/usr/bin/env bash
# Generates an upload keystore for Google Play. Store output secrets in CI:
# ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
set -euo pipefail
OUT="${1:-google-app/android/release.keystore}"
ALIAS="${ANDROID_KEY_ALIAS:-meta-upload}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-change-me-store}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-change-me-key}"

keytool -genkeypair -v \
  -keystore "$OUT" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Carl Laliberte, OU=META Dashboard, O=carllaliberte, L=Quebec, ST=QC, C=CA"

echo "Keystore: $OUT"
echo "Base64 for ANDROID_KEYSTORE_BASE64:"
base64 -w0 "$OUT"
echo ""
