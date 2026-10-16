#!/usr/bin/env bash
# Registers the Campus ID credential configuration with a running Inji Certify.
set -euo pipefail
CERTIFY="${CERTIFY_BASE_URL:-http://localhost:8090/v1/certify}"
curl -sS -X POST "$CERTIFY/credential-configurations" \
  -H 'Content-Type: application/json' \
  -d @"$(dirname "$0")/../services/certify-config/campus-id.credential-config.json"
echo
curl -sS "$CERTIFY/.well-known/openid-credential-issuer" | head -c 600; echo
