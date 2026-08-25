#!/usr/bin/env bash
# Capacitor cap sync may rewrite Package.swift with wrong SPM product casing — fix it.
set -euo pipefail
PKG="ios/App/CapApp-SPM/Package.swift"
if [ -f "$PKG" ]; then
  sed -i.bak \
    -e 's/CreatorflowStorekit/CreatorFlowStoreKit/g' \
    "$PKG"
  rm -f "${PKG}.bak"
  echo "✓ Fixed CreatorFlowStoreKit SPM references in $PKG"
fi
