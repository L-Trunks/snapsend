import base64
import io
from datetime import datetime, timedelta
from typing import Optional, List

import qrcode
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import settings
from ..models import Share, File
from ..schemas import CreateShareRequest, CreateShareResponse, ShareInfo, FileInfo
from ..utils.code_gen import generate_code, generate_delete_token
from ..utils.security import hash_password, verify_password
from .storage_service import store_file, delete_share_files


async def _generate_unique_code(db: AsyncSession, length: int, charset: str) -> str:
    for _ in range(100):
        code = generate_code(charset, length)
        result = await db.execute(select(Share).where(Share.code == code))
        if result.scalar_one_or_none() is None:
            return code
    raise RuntimeError("Failed to generate unique code after 100 attempts")


def _generate_qr_base64(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


async def create_share(
    db: AsyncSession,
    req: CreateShareRequest,
) -> CreateShareResponse:
    # Validate expire
    expire_seconds = min(max(req.expire_seconds, 60), settings.MAX_EXPIRE)
    expire_at = datetime.utcnow() + timedelta(seconds=expire_seconds)

    # Validate custom code
    if req.custom_code and settings.ENABLE_CUSTOM_CODE:
        code = req.custom_code.upper()
        existing = await db.execute(select(Share).where(Share.code == code))
        if existing.scalar_one_or_none() is not None:
            raise ValueError("Custom code already in use")
    else:
        code = await _generate_unique_code(db, settings.CODE_LENGTH, settings.CODE_CHARSET)

    # Determine share type
    has_files = len(req.upload_ids) > 0
    has_text = bool(req.text_content and req.text_content.strip())
    if has_files and has_text:
        share_type = "mixed"
    elif has_files:
        share_type = "file"
    else:
        share_type = "text"

    delete_token = generate_delete_token()
    password_hash = hash_password(req.password) if req.password else None

    share = Share(
        code=code,
        type=share_type,
        text_content=req.text_content,
        password_hash=password_hash,
        max_downloads=req.max_downloads,
        expire_at=expire_at,
        delete_token=delete_token,
    )
    db.add(share)
    await db.flush()  # Get share.id

    # Process file uploads
    if has_files:
        if len(req.upload_ids) > settings.MAX_FILES_PER_SHARE:
            raise ValueError(f"Too many files (max {settings.MAX_FILES_PER_SHARE})")
        for upload_id in req.upload_ids:
            file_meta = store_file(upload_id, code)
            if not file_meta:
                raise ValueError(f"Invalid or incomplete upload: {upload_id}")
            file_record = File(
                share_id=share.id,
                filename=file_meta["filename"],
                size=file_meta["size"],
                mime_type=file_meta["mime_type"],
                storage_path=file_meta["storage_path"],
            )
            db.add(file_record)

    await db.commit()

    pickup_link = f"{settings.BASE_URL}/{code}"
    qr_base64 = _generate_qr_base64(pickup_link)

    return CreateShareResponse(
        code=code,
        delete_token=delete_token,
        expire_at=expire_at,
        link=pickup_link,
        qr_code_base64=qr_base64,
    )


async def get_share(db: AsyncSession, code: str) -> Optional[Share]:
    result = await db.execute(
        select(Share)
        .where(Share.code == code.upper())
        .options(selectinload(Share.files))
    )
    share = result.scalar_one_or_none()
    if share is None:
        return None
    if share.expire_at < datetime.utcnow():
        return None
    return share


def build_share_info(share: Share) -> ShareInfo:
    remaining = max(0, int((share.expire_at - datetime.utcnow()).total_seconds()))
    files = [
        FileInfo(
            id=f.id,
            filename=f.filename,
            size=f.size,
            mime_type=f.mime_type,
            created_at=f.created_at,
        )
        for f in share.files
    ]
    return ShareInfo(
        code=share.code,
        type=share.type,
        text_content=share.text_content,
        has_password=share.password_hash is not None,
        max_downloads=share.max_downloads,
        download_count=share.download_count,
        expire_at=share.expire_at,
        created_at=share.created_at,
        files=files,
        remaining_seconds=remaining,
    )


async def verify_share_password(share: Share, password: str) -> bool:
    if share.password_hash is None:
        return True
    return verify_password(password, share.password_hash)


async def increment_download_count(db: AsyncSession, share: Share) -> None:
    share.download_count += 1
    await db.commit()


async def delete_share_by_token(db: AsyncSession, code: str, token: str) -> bool:
    result = await db.execute(
        select(Share).where(Share.code == code.upper()).options(selectinload(Share.files))
    )
    share = result.scalar_one_or_none()
    if not share or share.delete_token != token:
        return False
    delete_share_files(share.code)
    await db.delete(share)
    await db.commit()
    return True


async def cleanup_expired_shares(db: AsyncSession) -> int:
    """Delete all expired shares and their files. Returns count of deleted shares."""
    result = await db.execute(
        select(Share)
        .where(Share.expire_at < datetime.utcnow())
        .options(selectinload(Share.files))
    )
    shares = result.scalars().all()
    count = 0
    for share in shares:
        delete_share_files(share.code)
        await db.delete(share)
        count += 1
    if count:
        await db.commit()
    return count
