from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    role: str


class CredentialCreate(BaseModel):
    credential_id: str = Field(min_length=1, max_length=128)
    roll_number: str = Field(min_length=1, max_length=64)
    status_list_credential: str
    status_list_index: int = Field(ge=0)


class CredentialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    credential_id: str
    roll_number: str
    status_list_credential: str
    status_list_index: int
    issued_at: datetime
    revoked_at: datetime | None


class RevocationStatus(BaseModel):
    credential_id: str
    revoked: bool
    revoked_at: datetime | None = None


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    at: datetime
    actor: str
    action: str
    target: str


class VerifyRequest(BaseModel):
    presentation: str
    nonce: str
    aud: str
    required_claims: list[str] | None = None


class VerifyResult(BaseModel):
    status: str
    reasons: list[str]
    claims: dict
    hidden: int
    credential_id: str | None
    issuer: str | None
    issuer_cert_sha256: str | None
    registered: bool


class PresentationRequestCreate(BaseModel):
    client_name: str = "Campus Central Gate / Verifier"
    client_id: str = "campus-verifier"
    purpose: str = "Verify student identity and enrollment status"
    required_claims: list[str] = Field(default_factory=lambda: ["enrollment_status", "valid_until"])
    optional_claims: list[str] = Field(default_factory=lambda: ["name", "roll_number", "branch"])


class PresentationRequestOut(BaseModel):
    nonce: str
    client_id: str
    client_name: str
    purpose: str
    required_claims: list[str]
    optional_claims: list[str]
    response_uri: str
    openid4vp_uri: str


class VciTokenRequest(BaseModel):
    grant_type: str
    pre_authorized_code: str


class VciTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 300
    c_nonce: str


class VciCredentialRequest(BaseModel):
    format: str = "vc+sd-jwt"
    vct: str = "CampusID"
    proof: dict


class VciCredentialResponse(BaseModel):
    credential: str



class IssueRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    roll_number: str = Field(min_length=1, max_length=64)
    branch: str = Field(min_length=1, max_length=128)
    valid_until: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class IssueOut(BaseModel):
    credential_id: str
    credential_offer_uri: str
    mock: bool
