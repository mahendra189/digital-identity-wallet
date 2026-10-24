"""Database migration manager for Digital Identity Wallet."""
import asyncio
from pathlib import Path
from sqlalchemy import text
from app.db import engine


async def run_migrations() -> None:
    migration_file = Path(__file__).resolve().parent.parent / "migrations" / "001_initial_schema.sql"
    if not migration_file.is_file():
        print(f"Migration file not found at {migration_file}")
        return

    sql_statements = migration_file.read_text().split(";")
    async with engine.begin() as conn:
        for stmt in sql_statements:
            clean = stmt.strip()
            if clean:
                # Replace Postgres SERIAL with standard INTEGER PRIMARY KEY for SQLite if needed
                if "sqlite" in str(engine.url):
                    clean = clean.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                    clean = clean.replace("TIMESTAMP WITH TIME ZONE", "DATETIME")
                await conn.execute(text(clean))
    print("Database migrations applied successfully.")


if __name__ == "__main__":
    asyncio.run(run_migrations())
