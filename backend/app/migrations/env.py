import asyncio
from logging.config import fileConfig
from typing import Any

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.db.postgres import Base

# Each service owns its models under app/services/<name>/models.py (ADR-005). Import
# side-effect only (registers each model's Table on Base.metadata) — required for
# `alembic revision --autogenerate` to see them; add new services' models here as they
# land.
# progress/ has no models.py — its schemas.py/service.py compose scores.service's
# interface functions instead of owning any Postgres table (docs/ARCHITECTURE.md §4:
# this dashboard-scope slice reads skin_scores, doesn't write anything of its own).
from app.services.admin import models as _admin_models  # noqa: F401
from app.services.consultant_profile import models as _consultant_profile_models  # noqa: F401
from app.services.dermatologist_profile import models as _dermatologist_profile_models  # noqa: F401
from app.services.ingredients import models as _ingredients_models  # noqa: F401
from app.services.recommendations import models as _recommendations_models  # noqa: F401
from app.services.routines import models as _routines_models  # noqa: F401
from app.services.scores import models as _scores_models  # noqa: F401
from app.services.skin_profile import models as _skin_profile_models  # noqa: F401
from app.services.user import models as _user_models  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Secrets/config come from Settings (env only), never from alembic.ini
# (CONVENTIONS.md golden rule 6).
config.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def include_object(
    object: Any, name: str | None, type_: str, reflected: bool, compare_to: Any
) -> bool:
    if type_ == "table":
        # app.db.postgres.external_user_table exists only so SQLAlchemy can resolve FK
        # references to Better Auth's "user" table — never let Alembic create/alter
        # it, that table belongs to the Better Auth CLI's own migration stream.
        if name == "user":
            return False
        # Tables that exist in the DB but have no SQLAlchemy model yet belong to a
        # service that hasn't adopted Alembic management for its tables yet (see the
        # import block above) — never propose dropping them just because they're not
        # in our metadata. This is the incremental per-service adoption env.py
        # documents; without this, autogenerate treats every not-yet-modeled table as
        # "should be removed."
        if reflected and compare_to is None:
            return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
