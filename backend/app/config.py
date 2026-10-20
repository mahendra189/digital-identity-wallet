from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://wallet:wallet@localhost:5432/wallet"
    secret_key: str = "change-me"
    token_ttl_seconds: int = 3600
    certify_base_url: str = "http://localhost:8080/v1/certify"
    certify_mock: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    issuer_cert_sha256: str | None = None
    seed_admin_username: str = "admin"
    seed_admin_password: str = "admin123"
    seed_verifier_username: str = "verifier"
    seed_verifier_password: str = "verifier123"


settings = Settings()
