import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..config import settings
from ..database import AsyncSessionLocal
from .share_service import cleanup_expired_shares

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _run_cleanup():
    logger.info(f"[{datetime.utcnow().isoformat()}] Running cleanup task...")
    async with AsyncSessionLocal() as db:
        count = await cleanup_expired_shares(db)
    if count:
        logger.info(f"Cleanup: removed {count} expired share(s).")
    else:
        logger.debug("Cleanup: nothing to remove.")


def start_cleanup_scheduler():
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _run_cleanup,
        "interval",
        seconds=settings.CLEANUP_INTERVAL,
        id="cleanup_expired",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(f"Cleanup scheduler started (interval={settings.CLEANUP_INTERVAL}s).")


def stop_cleanup_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
