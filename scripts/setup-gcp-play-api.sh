#!/usr/bin/env bash
# Run in Google Cloud Shell (console.cloud.google.com → Activate Cloud Shell)
# Steps 1–3: enable API, create service account, download JSON key.
set -euo pipefail

SA_NAME="${SA_NAME:-play-upload}"
KEY_FILE="${KEY_FILE:-play-upload-key.json}"

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "=== Step 1: Enable Google Play Android Developer API ==="
gcloud services enable androidpublisher.googleapis.com --project="$PROJECT_ID"

echo "=== Step 2: Create service account ==="
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  echo "Service account already exists: $SA_EMAIL"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="META Dashboard Play upload" \
    --project="$PROJECT_ID"
fi

echo "=== Step 2b: Create JSON key ==="
if [[ -f "$KEY_FILE" ]]; then
  echo "Key file $KEY_FILE already exists — delete it to create a new key."
else
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID"
  echo "Saved: $KEY_FILE"
fi

echo ""
echo "=== Step 3: Invite in Google Play Console (manual) ==="
echo "1. Open https://play.google.com/console/users-and-permissions/invites"
echo "2. Invite: $SA_EMAIL"
echo "3. Permissions: View app info + Release to testing tracks (or Admin for first setup)"
echo "4. Send invite"
echo ""
echo "Then run on your machine (with gh CLI):"
echo "  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=\$(cat $KEY_FILE) bash scripts/apply-github-secrets.sh"
