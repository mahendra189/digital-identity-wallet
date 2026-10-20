#!/usr/bin/env bash
# Registers the Campus ID (vc+sd-jwt) configuration with a running Inji Certify.
set -uo pipefail
CERTIFY="${CERTIFY_BASE_URL:-http://localhost:8090/v1/certify}"
CFG="$(dirname "$0")/../services/certify-config/campus-id.credential-config.json"
echo "POST $CERTIFY/credential-configurations"
curl -sS -o /tmp/register.out -w "HTTP %{http_code}\n" -X POST "$CERTIFY/credential-configurations" \
  -H 'Content-Type: application/json' -d @"$CFG"
cat /tmp/register.out; echo
echo "--- issuer metadata (CampusID entry)"
curl -sS "$CERTIFY/.well-known/openid-credential-issuer" | grep -o '"CampusID":{[^}]*' | head -c 600; echo
