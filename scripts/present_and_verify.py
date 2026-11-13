#!/usr/bin/env python3
"""Present a Campus ID with chosen fields (holder side), then verify it (verifier side).

  python3 scripts/present_and_verify.py present --reveal roll_number,enrollment_status \
      --aud library-desk --nonce abc123
  python3 scripts/present_and_verify.py verify --aud library-desk --nonce abc123 \
      [--revoked CID-21CS042 | --backend http://localhost:8000] [--pin <issuer cert sha256>]
"""
import argparse, json, pathlib, sys, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "backend"))
from app.sdjwt_verify import build_presentation, verify_presentation  # noqa: E402

ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest="cmd", required=True)
p = sub.add_parser("present")
p.add_argument("--credential", default="issued_campus_id.txt")
p.add_argument("--key", default="holder_key.pem")
p.add_argument("--reveal", required=True, help="comma separated, e.g. roll_number,enrollment_status")
p.add_argument("--aud", required=True)
p.add_argument("--nonce", required=True)
p.add_argument("--out", default="presentation.txt")
v = sub.add_parser("verify")
v.add_argument("--presentation", default="presentation.txt")
v.add_argument("--aud", required=True)
v.add_argument("--nonce", required=True)
v.add_argument("--revoked", default="", help="comma separated credential ids treated as revoked")
v.add_argument("--backend", help="fetch the public revoked list from our API")
v.add_argument("--pin", help="expected SHA-256 fingerprint of the issuer certificate")
a = ap.parse_args()

if a.cmd == "present":
    pres = build_presentation(open(a.credential).read().strip(), open(a.key, "rb").read(),
                              [f.strip() for f in a.reveal.split(",")], a.aud, a.nonce)
    open(a.out, "w").write(pres)
    print(f"Presentation saved to {a.out}: revealing {a.reveal} (everything else stays hidden)")
else:
    revoked = {x for x in a.revoked.split(",") if x}
    if a.backend:
        revoked |= set(json.load(urllib.request.urlopen(a.backend.rstrip("/") + "/api/v1/revocations")))
    res = verify_presentation(open(a.presentation).read().strip(), expected_nonce=a.nonce, expected_aud=a.aud,
                              revoked_ids=revoked, pin_sha256=a.pin)
    print("RESULT:", res["status"].upper())
    for r in res["reasons"]:
        print("  reason:", r)
    print("credential_id:", res["credential_id"])
    print("issuer:", res["issuer"], "| issuer cert sha256:", res["issuer_cert_sha256"])
    print("revealed:", json.dumps(res["claims"], indent=2))
    print("hidden fields:", res["hidden"])
    sys.exit(0 if res["status"] == "valid" else 1)
