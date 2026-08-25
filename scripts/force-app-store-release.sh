#!/usr/bin/env bash
# Force App Store Option B release procedure (run on macOS with Xcode).
# Usage: bash scripts/force-app-store-release.sh [VITE_API_URL]
#
# Archive + upload (Action 4) — set on Mac:
#   export APPLE_TEAM_ID=XXXXXXXXXX
#   export APP_STORE_CONNECT_API_KEY_ID=...
#   export APP_STORE_CONNECT_API_ISSUER_ID=...
#   export APP_STORE_CONNECT_API_KEY_PATH=~/AuthKey_XXX.p8
#   bash scripts/force-app-store-release.sh https://your-api.example.com
#
# Or CI: GitHub → Actions → "iOS App Store release" → Run workflow
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${1:-${VITE_API_URL:-}}"

echo "═══════════════════════════════════════════════════"
echo " CreatorFlow — Force App Store Release (Option B)"
echo "═══════════════════════════════════════════════════"

# ── ACTION 1: Git — branch + PR ─────────────────────────────────────────────
echo ""
echo "▶ ACTION 1 — Git branch + PR"
cd "$ROOT"

if git rev-parse deliverable/app-store-option-b-5045 >/dev/null 2>&1; then
  git fetch origin tag deliverable/app-store-option-b-5045 2>/dev/null || true
  git checkout -B cursor/app-store-iap-option-b-5045 deliverable/app-store-option-b-5045 2>/dev/null || \
    git checkout -B cursor/app-store-iap-option-b-5045
else
  git checkout -B cursor/app-store-iap-option-b-5045
fi

git push -u origin cursor/app-store-iap-option-b-5045 || {
  echo "⚠ Branch push failed. Open PR manually:"
  echo "  https://github.com/carllaliberte/contract/compare/main...deliverable/app-store-option-b-5045?expand=1"
}

if command -v gh >/dev/null 2>&1; then
  EXISTING=$(gh pr list --head cursor/app-store-iap-option-b-5045 --json url --jq '.[0].url' 2>/dev/null || true)
  if [ -z "$EXISTING" ] || [ "$EXISTING" = "null" ]; then
    gh pr create \
      --base main \
      --head cursor/app-store-iap-option-b-5045 \
      --title "feat(ios): App Store Pro IAP + submission pack (Option B)" \
      --body "See AGENTS.md and creatorflow/docs/APP_STORE_CONNECT.md" \
      --draft 2>/dev/null && echo "✓ Draft PR created" || true
  else
    echo "✓ PR exists: $EXISTING"
  fi
fi

# ── ACTION 2: App Store Connect checklist ───────────────────────────────────
echo ""
echo "▶ ACTION 2 — App Store Connect"
echo "  Bundle ID:     com.carllaliberte.creatorflow"
echo "  Products:      cf_pro_monthly (6,99 CAD) · cf_pro_yearly (59,99 CAD)"
echo "  Privacy URL:   https://carllaliberte.github.io/contract/creatorflow/privacy.html"
echo "  Terms URL:     https://carllaliberte.github.io/contract/creatorflow/terms.html"
echo "  Webhook URL:   ${API_URL:-https://YOUR-API}/iap/apple/notifications"
echo ""
echo "  StoreKit config: creatorflow/ios/App/Products.storekit"
echo "  Full checklist:  creatorflow/docs/APP_STORE_CONNECT.md"
echo ""
open "https://appstoreconnect.apple.com/apps" 2>/dev/null || true

# ── ACTION 3: Build iOS (web + cap sync) ────────────────────────────────────
echo ""
echo "▶ ACTION 3 — Build iOS (web + cap sync)"
cd "$ROOT/creatorflow"

if [ -z "$API_URL" ]; then
  echo "⚠ VITE_API_URL not set — using empty (configure before App Store release)"
  API_URL=""
fi

npm ci
export VITE_API_URL="$API_URL"
unset VITE_AUTH_STUB 2>/dev/null || true

echo "→ npm run build:ios"
npm run build:ios

# ── ACTION 4: Archive + upload to App Store Connect ─────────────────────────
echo ""
echo "▶ ACTION 4 — Archive + submit to App Store Connect"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "⚠ Not macOS — archive skipped."
  echo "  On Mac: export APPLE_TEAM_ID=... && bash scripts/ios-archive-and-upload.sh"
  echo "  Or CI:  GitHub → Actions → iOS App Store release → Run workflow"
else
  if [[ -n "${APPLE_TEAM_ID:-}" ]]; then
    bash "$ROOT/scripts/ios-archive-and-upload.sh"
  else
    echo "⚠ APPLE_TEAM_ID not set — opening Xcode for manual archive."
    npm run cap:open:ios
    echo ""
    echo "Manual steps in Xcode:"
    echo "  1. Signing & Capabilities → Team + In-App Purchase"
    echo "  2. Product → Archive → Distribute App → App Store Connect"
    echo ""
    echo "Or automate next time:"
    echo "  export APPLE_TEAM_ID=XXXXXXXXXX"
    echo "  export APP_STORE_CONNECT_API_KEY_ID=..."
    echo "  export APP_STORE_CONNECT_API_ISSUER_ID=..."
    echo "  export APP_STORE_CONNECT_API_KEY_PATH=~/AuthKey_XXX.p8"
    echo "  bash scripts/ios-archive-and-upload.sh"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo " Done."
echo "  • Merge PR → deploy Pages (privacy URLs live)"
echo "  • App Store Connect → select build → Submit for Review"
echo "═══════════════════════════════════════════════════"
