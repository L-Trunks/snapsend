from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Share, File
from ..schemas import AdminStats
from ..services.storage_service import get_storage_used, human_size
from ..services.share_service import cleanup_expired_shares

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()

    active_count = await db.scalar(
        select(func.count()).select_from(Share).where(Share.expire_at > now)
    )
    file_count = await db.scalar(
        select(func.count()).select_from(File)
        .join(Share, File.share_id == Share.id)
        .where(Share.expire_at > now)
    )

    storage_bytes = get_storage_used()

    # Recent 10 shares
    recent_result = await db.execute(
        select(Share).order_by(Share.created_at.desc()).limit(10)
    )
    recent_shares = [
        {
            "code": s.code,
            "type": s.type,
            "expire_at": s.expire_at.isoformat(),
            "download_count": s.download_count,
            "created_at": s.created_at.isoformat(),
        }
        for s in recent_result.scalars().all()
    ]

    return AdminStats(
        active_shares=active_count or 0,
        total_files=file_count or 0,
        storage_used_bytes=storage_bytes,
        storage_used_human=human_size(storage_bytes),
        recent_shares=recent_shares,
    )


@router.post("/cleanup")
async def trigger_cleanup(db: AsyncSession = Depends(get_db)):
    count = await cleanup_expired_shares(db)
    return {"message": f"Cleaned up {count} expired share(s)"}
