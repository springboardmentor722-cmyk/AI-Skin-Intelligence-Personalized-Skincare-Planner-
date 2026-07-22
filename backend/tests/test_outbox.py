"""app/db/outbox.py — ADR-010's transactional outbox (M3-A). append_outbox() never
calls commit/rollback itself; it only adds a row to the session passed in, so it lives
or dies with whatever transaction the caller is already in. These tests prove that."""

import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.outbox import Outbox, append_outbox
from app.services.ingredients.models import Ingredient


class _Abort(Exception):
    """Marker to force a nested-transaction rollback mid-test."""


async def test_append_outbox_persists_a_pending_row(db_session: AsyncSession) -> None:
    aggregate_id = f"test-{uuid.uuid4().hex[:12]}"

    await append_outbox(db_session, "product", aggregate_id, "upsert", {"foo": "bar"})
    await db_session.flush()

    row = (
        await db_session.execute(select(Outbox).where(Outbox.aggregate_id == aggregate_id))
    ).scalar_one()
    assert row.aggregate_type == "product"
    assert row.event_type == "upsert"
    assert row.payload == {"foo": "bar"}
    assert row.processed_at is None


async def test_append_outbox_rolls_back_with_the_source_write(db_session: AsyncSession) -> None:
    """A rolled-back source write leaves no outbox row — the whole point of writing
    the outbox in the same transaction rather than as a separate call."""
    aggregate_id = f"test-rollback-{uuid.uuid4().hex[:12]}"
    ingredient_name = f"Rollback Test Ingredient {uuid.uuid4().hex[:8]}"

    with pytest.raises(_Abort):
        async with db_session.begin_nested():
            db_session.add(Ingredient(ingredient_name=ingredient_name))
            await db_session.flush()
            await append_outbox(db_session, "ingredient", aggregate_id, "upsert", {})
            raise _Abort()

    outbox_row = (
        await db_session.execute(select(Outbox).where(Outbox.aggregate_id == aggregate_id))
    ).first()
    assert outbox_row is None

    ingredient_row = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == ingredient_name)
        )
    ).first()
    assert ingredient_row is None
