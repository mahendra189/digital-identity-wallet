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


class VerifyResult(BaseModel):
    status: str
    reasons: list[str]
    claims: dict
    hidden: int
    credential_id: str | None
    issuer: str | None
    issuer_cert_sha256: str | None
    registered: bool
