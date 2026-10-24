from pydantic_settings import BaseSettings, SettingsConfigDict


from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./wallet.db"
    secret_key: str = "dev-insecure-secret-key-change-in-production-min-32-chars"
    jwt_algorithm: str = "HS256"
    token_ttl_seconds: int = 3600
    token_issuer: str = "campus-id-auth-service"
    token_audience: str = "campus-id-platform"

    certify_base_url: str = "http://localhost:8080/v1/certify"
    certify_mock: bool = True
    public_base_url: str = "http://localhost:8000"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]
    issuer_cert_sha256: str | None = None
    seed_admin_username: str = "admin"
    seed_admin_password: str = "admin123"
    seed_verifier_username: str = "verifier"
    seed_verifier_password: str = "verifier123"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.environment.lower() == "production":
            insecure_secrets = {"change-me", "secret", "admin123", "password", "dev-insecure-secret-key-change-in-production-min-32-chars"}
            if self.secret_key in insecure_secrets or len(self.secret_key) < 32:
                raise ValueError("CRITICAL: Production deployment requires a secure, high-entropy secret_key of at least 32 characters.")
            if self.seed_admin_password in insecure_secrets or self.seed_verifier_password in insecure_secrets:
                raise ValueError("CRITICAL: Default seed passwords must not be used in production.")
        return self


settings = Settings()

