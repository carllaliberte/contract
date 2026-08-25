#!/usr/bin/env bash
# Launch the "virtual Mac" (GitHub Actions macos-latest) to archive CreatorFlow.
# No physical Mac required — runs in the cloud on Apple's toolchain via GitHub.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-ios-release/1.0.0}"
API_URL="${2:-${VITE_API_URL:-}}"

echo "🖥  Virtual Mac — GitHub Actions macos-latest"
echo "   Tag trigger: $TAG"
echo ""

cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) required."
  exit 1
fi

# Ensure latest code is tagged
git tag -f "$TAG"
git push origin "refs/tags/$TAG" --force

echo "✓ Pushed tag $TAG"
echo "  Workflow: macOS iOS build (virtual Mac)"
echo ""

# Also try workflow_dispatch if workflow exists on default branch
gh workflow run macos-ios-virtual.yml \
  --repo carllaliberte/contract \
  --ref "$TAG" \
  -f "vite_api_url=$API_URL" 2>/dev/null || \
  echo "(workflow_dispatch unavailable until merged to main — tag push triggers build)"

echo ""
echo "Monitor:"
echo "  gh run list --repo carllaliberte/contract --workflow=macos-ios-virtual.yml"
echo "  https://github.com/carllaliberte/contract/actions"
