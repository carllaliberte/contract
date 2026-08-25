#!/usr/bin/env bash
# Scan tracked files for accidental secret material (OpenAI keys, PEM private keys).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXCLUDE=(
  -- ':!*.md'
  -- ':!**/.env.example'
  -- ':!**/secrets-a-remplir.env.example'
  -- ':!google-app/play-store/META_PLAY_CONFIG.example.json'
  -- ':!**/package-lock.json'
  -- ':!scripts/check-no-secrets.sh'
  -- ':!gitignore-append.txt'
)

fail=0

# OpenAI-style keys (require length beyond placeholder "sk-...")
matches="$(git grep -nE 'sk-[a-zA-Z0-9]{20,}' -- . "${EXCLUDE[@]}" 2>/dev/null || true)"
if [ -n "$matches" ]; then
  printf '%s\n' "$matches"
  echo "::error::Possible live OpenAI API key (sk-...) in tracked files"
  fail=1
fi

# PEM private keys (exclude documented example JSON)
matches="$(git grep -nF '-----BEGIN PRIVATE KEY-----' -- . "${EXCLUDE[@]}" 2>/dev/null || true)"
if [ -n "$matches" ]; then
  printf '%s\n' "$matches"
  echo "::error::Possible PEM private key in tracked files"
  fail=1
fi

# Play fill-in env must stay untracked once populated
if git ls-files --error-unmatch google-app/play-store/secrets-a-remplir.env >/dev/null 2>&1; then
  echo "::error::google-app/play-store/secrets-a-remplir.env is tracked — remove from git and use .example template"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "Secret hygiene check passed (no sk- / BEGIN PRIVATE KEY anti-patterns in tree)"
