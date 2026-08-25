#!/usr/bin/env bash
# Google Cloud Shell — Workload Identity Federation for GitHub Actions (no JSON secret on GitHub).
set -euo pipefail

SA_NAME="${SA_NAME:-play-upload}"
POOL_ID="${POOL_ID:-github-pool}"
PROVIDER_ID="${PROVIDER_ID:-github-provider}"
REPO="${GITHUB_REPO:-carllaliberte/contract}"
OUT_FILE="${OUT_FILE:-google-app/play-store/github-wif.json}"

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "Choisissez un projet : gcloud config set project VOTRE_PROJECT_ID"
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== WIF pour $REPO (projet $PROJECT_ID) ==="

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"

if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
  --project="$PROJECT_ID" --location="global" &>/dev/null; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" \
    --location="global" \
    --display-name="GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --project="$PROJECT_ID" --location="global" \
  --workload-identity-pool="$POOL_ID" &>/dev/null; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$POOL_ID" \
    --display-name="GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
fi

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${REPO}" \
  --quiet

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

mkdir -p "$(dirname "$OUT_FILE")"
node -e "
const fs = require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  projectId: process.argv[2],
  projectNumber: process.argv[3],
  workloadIdentityProvider: process.argv[4],
  serviceAccount: process.argv[5],
  repository: process.argv[6]
}, null, 2) + '\n');
" "$OUT_FILE" "$PROJECT_ID" "$PROJECT_NUMBER" "$WIF_PROVIDER" "$SA_EMAIL" "$REPO"

echo ""
echo "Fichier créé: $OUT_FILE"
echo "Compte Play API: $SA_EMAIL"
echo "WIF provider: $WIF_PROVIDER"
echo ""
echo "Commit ce fichier sur GitHub → CI upload sans secret JSON Google."
