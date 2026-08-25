#!/usr/bin/env bash
# Google Cloud Shell — download signed AAB from GitHub Release and upload to Play.
# Prereqs: run cloud-shell-play-setup.sh first (creates META_PLAY_CONFIG.json here).
set -euo pipefail

REPO="${GITHUB_REPO:-carllaliberte/contract}"
TAG="${RELEASE_TAG:-play-internal-20250825}"
CONFIG="${META_PLAY_CONFIG_FILE:-META_PLAY_CONFIG.json}"
OUT_DIR="${OUT_DIR:-./play-upload-tmp}"

if [[ ! -f "$CONFIG" ]]; then
  echo "Missing $CONFIG — run: bash scripts/cloud-shell-play-setup.sh"
  exit 1
fi

mkdir -p "$OUT_DIR"
AAB="$OUT_DIR/app-release.aab"

echo "=== Download AAB from GitHub Release $TAG ==="
curl -fsSL \
  "https://github.com/$REPO/releases/download/$TAG/app-release.aab" \
  -o "$AAB"
ls -la "$AAB"

export META_PLAY_CONFIG="$(cat "$CONFIG")"
bash "$(dirname "$0")/upload-play-aab.sh" "$AAB"
