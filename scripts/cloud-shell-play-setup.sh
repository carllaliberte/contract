#!/usr/bin/env bash
# Google Cloud Shell — API Play + keystore + fichier META_PLAY_CONFIG (1 secret GitHub)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_FILE="${KEY_FILE:-play-upload-key.json}"
KEYSTORE="${KEYSTORE:-meta-release.keystore}"
STORE_PASS="${STORE_PASS:-MetaCarl2026}"
KEY_PASS="${KEY_PASS:-$STORE_PASS}"
ALIAS="${ALIAS:-meta-upload}"
OUT_JSON="${OUT_JSON:-META_PLAY_CONFIG.json}"
SA_NAME="${SA_NAME:-play-upload}"

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "Choisissez un projet : gcloud config set project VOTRE_PROJECT_ID"
  exit 1
fi

echo "=== Projet: $PROJECT_ID ==="

gcloud services enable androidpublisher.googleapis.com --project="$PROJECT_ID"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="META Dashboard Play upload" \
    --project="$PROJECT_ID"
fi

if [[ ! -f "$KEY_FILE" ]]; then
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID"
fi

echo "=== Keystore Android ==="
if [[ ! -f "$KEYSTORE" ]]; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASS" -keypass "$KEY_PASS" \
    -dname "CN=Carl Laliberte, OU=META, O=carllaliberte, L=QC, ST=QC, C=CA"
fi

B64="$(base64 -w0 "$KEYSTORE" 2>/dev/null || base64 "$KEYSTORE" | tr -d '\n')"
PLAY_JSON="$(cat "$KEY_FILE")"

node -e "
const fs = require('fs');
const cfg = {
  keystorePassword: '$STORE_PASS',
  keyPassword: '$KEY_PASS',
  keyAlias: '$ALIAS',
  keystoreBase64: '$B64',
  playServiceAccountJson: JSON.parse(process.argv[1])
};
fs.writeFileSync('$OUT_JSON', JSON.stringify(cfg));
" "$PLAY_JSON"

echo ""
echo "=============================================="
echo "ÉTAPE PLAY CONSOLE (2 min)"
echo "1. https://play.google.com/console/users-and-permissions/invites"
echo "2. Inviter: $SA_EMAIL"
echo "3. Permissions: Release to testing tracks + View app info"
echo "4. Envoyer l'invitation"
echo ""
echo "ÉTAPE GITHUB (1 secret)"
echo "1. https://github.com/carllaliberte/contract/settings/secrets/actions"
echo "2. New repository secret"
echo "3. Name: META_PLAY_CONFIG"
echo "4. Secret: copier TOUT le fichier $OUT_JSON (menu Cloud Shell → Download file)"
echo "   Mot de passe keystore: $STORE_PASS"
echo ""
echo "Fichier créé: $OUT_JSON"
echo ""
echo "UPLOAD RAPIDE (tout en un) :"
echo "  bash $ROOT/scripts/cloud-shell-fix-and-upload.sh"
echo "=============================================="
