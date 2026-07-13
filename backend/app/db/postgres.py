from collections.abc import AsyncGenerator

from sqlalchemy import Column, Table, Text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Shared declarative base. Each service owns its own tables (ADR-005) — a service
    never imports another service's models, only this base and its own module."""


# Stub for Better Auth's "user" table — owned by the Better Auth CLI's migration
# stream, never Alembic's (CONVENTIONS.md). Just enough columns for SQLAlchemy to
# resolve FK references from our tables to it (id) and for tests/conftest.py's
# `test_user_id` fixture to satisfy the real table's NOT NULL constraint on email when
# inserting a throwaway row (nothing else ever writes through this Table object — the
# app never creates real users, Better Auth does, directly, outside Alembic/this
# engine entirely); env.py's `include_object` excludes it from autogenerate so Alembic
# never tries to create/alter it. `name` added for clinical_review/service.py — the
# first backend service needing a real display name, not just email (mirrors what
# web/app/api/admin/users/route.ts already reads from Better Auth's own admin API on
# the frontend side). Nullable here to match the real live column exactly (confirmed
# via `\d "user"` against the real Docker Postgres) — existing test inserts that don't
# supply a name stay valid.
external_user_table = Table(
    "user",
    Base.metadata,
    Column("id", Text, primary_key=True),
    Column("email", Text, nullable=False),
    Column("name", Text, nullable=True),
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
