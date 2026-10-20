#!/usr/bin/env python3
"""Issues one Campus ID from a local Inji Certify using the pre-authorized-code flow,
acting as a minimal wallet (own key + proof JWT). Needs: pip install cryptography"""
import base64, json, sys, time, urllib.parse, urllib.request, urllib.error
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8090/v1/certify"
CLAIMS = {
    "name": "Priya Sharma", "roll_number": "21CS042", "branch": "Computer Science",
    "enrollment_status": "ACTIVE", "valid_until": "2028-06-30", "credential_id": "CID-21CS042",
}

def b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()

def unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def call(method, url, body=None, headers=None, form=False):
    data = None
    h = dict(headers or {})
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            h["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} from {url}\n{e.read().decode()}")
        sys.exit(1)

print("1. creating credential offer")
offer_resp = call("POST", f"{BASE}/pre-authorized-data", {"credential_configuration_id": "CampusID", "claims": CLAIMS})
offer_uri = urllib.parse.parse_qs(urllib.parse.urlparse(offer_resp["credential_offer_uri"]).query).get("credential_offer_uri", [offer_resp["credential_offer_uri"]])[0]
offer_id = offer_uri.rstrip("/").split("/")[-1]
offer = call("GET", f"{BASE}/credential-offer-data/{offer_id}")
code = offer["grants"]["urn:ietf:params:oauth:grant-type:pre-authorized_code"]["pre-authorized_code"]

print("2. exchanging code for token")
tok = call("POST", f"{BASE}/oauth/token", {"grant_type": "urn:ietf:params:oauth:grant-type:pre-authorized_code", "pre-authorized_code": code}, form=True)

print("3. building proof of possession")
meta = call("GET", f"{BASE}/.well-known/openid-credential-issuer")
aud = meta["credential_issuer"]
key = ec.generate_private_key(ec.SECP256R1())
n = key.public_key().public_numbers()
jwk = {"kty": "EC", "crv": "P-256", "x": b64(n.x.to_bytes(32, "big")), "y": b64(n.y.to_bytes(32, "big"))}
kid = "did:jwk:" + b64(json.dumps(jwk, separators=(",", ":")).encode()) + "#0"
head = b64(json.dumps({"alg": "ES256", "typ": "openid4vci-proof+jwt", "kid": kid}).encode())
pay = b64(json.dumps({"aud": aud, "iat": int(time.time()), "nonce": tok.get("c_nonce", "")}).encode())
r, s = decode_dss_signature(key.sign(f"{head}.{pay}".encode(), ec.ECDSA(hashes.SHA256())))
proof = f"{head}.{pay}.{b64(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"

print("4. requesting credential")
res = call("POST", f"{BASE}/issuance/credential",
           {"format": "vc+sd-jwt", "vct": "CampusID", "proof": {"proof_type": "jwt", "jwt": proof}},
           headers={"Authorization": "Bearer " + tok["access_token"]})
cred = res["credential"]
open("issued_campus_id.txt", "w").write(cred)
print("\nSaved to issued_campus_id.txt\n")
parts = cred.split("~")
print("payload:", json.dumps(json.loads(unb64(parts[0].split(".")[1])), indent=2))
print("hideable fields (disclosures):")
for d in parts[1:]:
    if d:
        salt, name, value = json.loads(unb64(d))
        print(f"  {name} = {value}")
