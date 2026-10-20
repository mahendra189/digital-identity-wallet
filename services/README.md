# Team 1 services

| Service | Port | Source |
|---|---|---|
| FastAPI | 8000 | `backend/` |
| Postgres (app) | 5432 | `services/docker-compose.yml` |
| Inji Certify | 8090 | upstream `inji-certify` v0.14.0, `docker-compose/docker-compose-injistack` |
| Certify Postgres / nginx | 5433 / 8091 | same compose |

## Run API + DB
```
cp .env.example services/.env && cd services && docker compose --env-file .env up --build
```

## Run Certify and issue a Campus ID (tested in WSL2 + Docker Desktop)
```
git clone --depth 1 --branch v0.14.0 https://github.com/mosip/inji-certify.git ~/work/inji-certify
UP=~/work/inji-certify/docker-compose/docker-compose-injistack
bash scripts/setup-certify-local.sh $UP      # config fixes + start Certify
bash scripts/register-campus-id.sh           # registers the SD-JWT Campus ID config
python3 scripts/issue_test_credential.py     # issues one credential as a test wallet
```
Only start the services you need: `docker compose up -d database certify certify-nginx`.

### Keep in mind
- Certify's signing key file lives inside the container. Use `docker compose stop/start/restart`. Do NOT use `down` or `--force-recreate` on certify: the database remembers the key but the file is gone ("No such alias"). Recovery: `docker compose down -v`, start again, re-run `register-campus-id.sh`.
- Never use `sed -i` on files mounted into the container; edit in place (the setup script does).
- Issuer in the credential is `http://certify-nginx:80` (a Docker-internal name). Verifiers outside Docker cannot resolve it; this needs a decision before verification (see below).

### Design
- Format `vc+sd-jwt`: holder can hide name, roll_number, branch, enrollment_status, valid_until. `credential_id` is always disclosed.
- Certify 0.14.0 attaches status-list revocation only to `ldp_vc`, so revocation for SD-JWT is handled by our backend (`/api/v1/credentials/{id}/revoke`, public list `/api/v1/revocations`), keyed on `credential_id`.
- Issuance uses the pre-authorized-code flow: the issuer system posts the student's claims to `/pre-authorized-data`; no external login server needed.

### Open items
- How Inji Verify validates this credential and resolves the issuer key.
- Photo field (left out of the first version).
