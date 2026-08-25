#!/usr/bin/env bash
# Push a Cursor agent branch when GitHub ruleset blocks integration tokens.
# Run locally as repo owner with push access.
set -euo pipefail

BRANCH="${1:-cursor/app-store-iap-option-b-5045}"
REMOTE="${2:-origin}"

echo "→ Pushing branch: $BRANCH to $REMOTE"

if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "Branch $BRANCH not found locally."
  exit 1
fi

# Ensure linear history (ruleset: required_linear_history)
MERGE_COUNT=$(git rev-list --merges "$BRANCH" --count 2>/dev/null || echo 0)
if [[ "$MERGE_COUNT" -gt 0 ]]; then
  echo "⚠ Branch contains $MERGE_COUNT merge commit(s)."
  echo "  Rebase onto main: git fetch origin main && git rebase origin/main"
  echo "  Or squash: git reset --soft origin/main && git commit -m 'feat: squashed agent changes'"
fi

git push -u "$REMOTE" "$BRANCH"

echo "✓ Pushed. Create PR:"
echo "  gh pr create --base main --head $BRANCH --title '...' --draft"
