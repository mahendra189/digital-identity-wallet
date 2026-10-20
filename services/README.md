# Team 1 services

| Service | Port | Source |
|---|---|---|
| FastAPI | 8000 | `backend/` |
| Postgres (app) | 5432 | `services/docker-compose.yml` |
| Inji Certify | 8090 -> remap if clashing | upstream `inji-certify/docker-compose/docker-compose-injistack` |
| Inji Verify | 8080 -> remap to 8081 | upstream `inji-verify/docker-compose` |

## Run API + DB
```
cp .env.example services/.env && cd services && docker compose --env-file .env up --build
```

## Run Certify / Verify (upstream, Not yet tested: needs a Docker host)
1. Clone `mosip/inji-certify` and `mosip/inji-verify`; start their compose stacks.
2. Remap host ports so Certify/Verify/verify-ui/Postgres do not clash with the table above.
3. `scripts/setup-certify-local.sh <upstream-compose-dir>` mounts the student data, then `scripts/register-campus-id.sh` posts `certify-config/campus-id.credential-config.json` (SD-JWT; revocation is handled by our backend, not Certify).
4. Set `CERTIFY_MOCK=false` and `CERTIFY_BASE_URL` to use the real revoke call:
   `POST {certify}/credentials/status` (exists in `CredentialStatusController`; body mirrors `UpdateCredentialStatusRequest`).

## Open items to verify on a Docker host
- Certify accepts `vc+sd-jwt` here (DTO has `sdJwtVct`, `sdJwtClaims`, `sdClaim`); the documented sample is `ldp_vc`.
- Status list entries are documented for `ldp_vc` with the W3C v2 context; confirm they are added to SD-JWT VCs.
- How Verify consumes the presentation and surfaces "Revoked".
