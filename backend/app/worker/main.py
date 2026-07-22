from arq.connections import RedisSettings
from arq.cron import cron

from app.core.config import settings
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.worker.poller import process_pending_outbox

# ADR-010: "derived stores are eventually consistent (seconds)". A cron tick every 2
# seconds satisfies that without a persistent listen/notify channel — simple, and the
# repo already treats outbox-polling latency as an accepted tradeoff (§2 risk table).


async def poll_outbox_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        return await process_pending_outbox(db, get_mongo_db())


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [cron(poll_outbox_tick, second=set(range(0, 60, 2)), run_at_startup=True)]
