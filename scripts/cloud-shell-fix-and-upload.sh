#!/usr/bin/env bash
# Google Cloud Shell — tout en un : API Play + WIF + upload AAB + (optionnel) secret GitHub.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== 1/4 API Play + keystore + META_PLAY_CONFIG ==="
bash scripts/cloud-shell-play-setup.sh

echo ""
echo "=== 2/4 Workload Identity (CI sans JSON Google) ==="
bash scripts/cloud-shell-wif-setup.sh

echo ""
echo "=== 3/4 Upload AAB → Play (internal) ==="
bash scripts/cloud-shell-play-upload-from-release.sh

echo ""
echo "=== 4/4 (optionnel) Secret GitHub ==="
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  gh secret set META_PLAY_CONFIG \
    --repo "${GITHUB_REPO:-carllaliberte/contract}" \
    --body "$(cat META_PLAY_CONFIG.json)"
  echo "Secret META_PLAY_CONFIG défini sur GitHub."
else
  echo "gh non connecté — collez META_PLAY_CONFIG.json dans GitHub Actions secrets."
fi

if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  if git diff --quiet google-app/play-store/github-wif.json; then
    echo "github-wif.json inchangé."
  else
    git add google-app/play-store/github-wif.json
    git commit -m "chore: add GitHub WIF config for Play upload"
    git push origin HEAD
    echo "github-wif.json poussé sur GitHub."
  fi
fi

echo ""
echo "=============================================="
echo "TERMINÉ — vérifiez Play Console → Internal testing"
echo "=============================================="
