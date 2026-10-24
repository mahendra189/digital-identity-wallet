#!/usr/bin/env bash
# Registers (or updates) the Campus ID (vc+sd-jwt) configuration in a running Inji Certify.
set -uo pipefail
CERTIFY="${CERTIFY_BASE_URL:-http://localhost:8090/v1/certify}"
CFG="$(dirname "$0")/../services/certify-config/campus-id.credential-config.json"
OUT="$(mktemp)"
code=$(curl -sS -o "$OUT" -w "%{http_code}" -X POST "$CERTIFY/credential-configurations" -H 'Content-Type: application/json' -d @"$CFG")
echo "POST -> HTTP $code"; cat "$OUT"; echo
if [ "$code" != "201" ]; then
  code=$(curl -sS -o "$OUT" -w "%{http_code}" -X PUT "$CERTIFY/credential-configurations/CampusID" -H 'Content-Type: application/json' -d @"$CFG")
  echo "PUT  -> HTTP $code"; cat "$OUT"; echo
fi
echo "--- CampusID in issuer metadata"
curl -sS "$CERTIFY/.well-known/openid-credential-issuer" | grep -o '"CampusID":{.\{0,500\}'; echo
