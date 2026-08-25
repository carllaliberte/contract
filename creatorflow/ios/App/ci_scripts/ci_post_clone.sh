#!/usr/bin/env bash
set -euo pipefail

echo "▶︎ [Xcode Cloud] Starting post-clone script..."

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node@22 || true
brew link --overwrite --force node@22 || true

cd "$(dirname "$0")/../../.."
echo "Current directory: $(pwd)"

npm ci
npm run build:ios
npx cap sync ios

cd ios/App
pod install --repo-update

echo "✅ Post-clone script finished"
