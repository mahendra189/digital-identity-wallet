#!/usr/bin/env bash
# Usage: scripts/setup-certify-local.sh <path-to>/inji-certify/docker-compose/docker-compose-injistack
set -euo pipefail
UP="${1:?path to docker-compose-injistack required}"
HERE="$(cd "$(dirname "$0")/.." && pwd)/services/certify-config"
cp "$HERE/campus_identity_data.csv" "$UP/config/campus_identity_data.csv"
cp "$HERE/docker-compose.override.yaml" "$UP/docker-compose.override.yaml"
cd "$UP"
docker compose up -d --force-recreate certify
echo "Certify restarted with Campus ID data mounted."
