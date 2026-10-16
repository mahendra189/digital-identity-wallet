from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.models import Account
from app.routers.api import router
from app.security import hash_password


async def seed() -> None:
    async with SessionLocal() as s:
        for u, p, r in (
            (settings.seed_admin_username, settings.seed_admin_password, "admin"),
            (settings.seed_verifier_username, settings.seed_verifier_password, "verifier"),
        ):
            if not (await s.execute(select(Account).where(Account.username == u))).scalar_one_or_none():
                s.add(Account(username=u, password_hash=hash_password(p), role=r))
        await s.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed()
    yield


app = FastAPI(title="Campus ID Issuer/Verifier API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
