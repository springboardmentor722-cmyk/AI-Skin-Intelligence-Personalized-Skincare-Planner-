from arq.connections import RedisSettings
from arq.cron import cron

from app.core.config import settings
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.worker.consumers.reminders import run_due_reminders
from app.worker.consumers.report_schedules import run_due_report_schedules
from app.worker.poller import process_pending_outbox

# ADR-010: "derived stores are eventually consistent (seconds)". A cron tick every 2
# seconds satisfies that without a persistent listen/notify channel — simple, and the
# repo already treats outbox-polling latency as an accepted tradeoff (§2 risk table).


async def poll_outbox_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        return await process_pending_outbox(db, get_mongo_db())


async def report_schedule_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        return await run_due_report_schedules(db)


async def reminder_due_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        return await run_due_reminders(db)


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        cron(poll_outbox_tick, second=set(range(0, 60, 2)), run_at_startup=True),
        # ponytail: exact-minute match against a 5-minute tick means a schedule can
        # miss its configured minute by up to 5 minutes of drift — fine for "roughly
        # weekly/monthly", upgrade to a minute-range match if exact timing matters.
        cron(report_schedule_tick, minute=set(range(0, 60, 5))),
        # ponytail: same 5-minute exact-minute-match limitation as report schedules.
        cron(reminder_due_tick, minute=set(range(0, 60, 5))),
    ]
