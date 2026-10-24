#!/usr/bin/env bash
# Usage: scripts/setup-certify-local.sh <path-to>/inji-certify/docker-compose/docker-compose-injistack
# Applies the three config changes Certify 0.14.0's sample setup needs for our Campus ID flow,
# then starts (or restarts) Certify. Edits files IN PLACE: Docker bind-mounts single files,
# so replacing them (e.g. sed -i) breaks the mount.
set -euo pipefail
UP="${1:?path to docker-compose-injistack required}"
cd "$UP"
docker network inspect mosip_network >/dev/null 2>&1 || docker network create --driver bridge mosip_network >/dev/null
mkdir -p data/CERTIFY_PKCS12

python3 - <<'PY'
def edit(path, fn):
    with open(path, "r+") as f:
        out = fn(f.read().split("\n"))
        f.seek(0); f.write("\n".join(out)); f.truncate()

# 1. the sample config forgets a cache the pre-authorized flow needs
def cache(lines):
    return [l + ",credentialOfferCache" if l.startswith("mosip.certify.cache.names=") and "credentialOfferCache" not in l else l for l in lines]
edit("config/certify-default.properties", cache)

# 2. let Certify validate the tokens it issues itself (instead of the external eSignet mock)
auth = {
 "mosip.certify.authorization.url=": "mosip.certify.authorization.url=${mosip.certify.domain.url}",
 "mosip.certify.authn.issuer-uri=": "mosip.certify.authn.issuer-uri=${mosip.certify.authorization.url}",
 "mosip.certify.authn.jwk-set-uri=": "mosip.certify.authn.jwk-set-uri=${mosip.certify.authorization.url}${server.servlet.path}/.well-known/jwks.json",
 "mosip.certify.authn.allowed-audiences=": "mosip.certify.authn.allowed-audiences={ '${mosip.certify.authorization.url}${server.servlet.path}/issuance/credential' }",
}
def authn(lines):
    return [next((v for k, v in auth.items() if l.startswith(k)), l) for l in lines]
edit("config/certify-default.properties", authn)

# 3. take the student data from the issuance request instead of the farmer CSV
def plugin(lines):
    return ["mosip.certify.integration.data-provider-plugin=PreAuthDataProviderPlugin" if l.startswith("mosip.certify.integration.data-provider-plugin=") else l for l in lines]
edit("config/certify-csvdp-farmer.properties", plugin)
print("config updated")
PY

if docker compose ps -q certify | grep -q .; then
  docker compose restart certify
else
  docker compose up -d database certify certify-nginx
fi
until curl -s -o /dev/null http://localhost:8090/v1/certify/.well-known/openid-credential-issuer; do echo waiting...; sleep 5; done
echo "Certify READY. Next: scripts/register-campus-id.sh, then scripts/issue_test_credential.py"
