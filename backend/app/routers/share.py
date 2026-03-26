import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Share, File
from ..schemas import (
    CreateShareRequest,
    CreateShareResponse,
    ShareInfo,
    VerifyPasswordRequest,
    DeleteShareRequest,
)
from ..services.share_service import (
    create_share,
    get_share,
    build_share_info,
    verify_share_password,
    increment_download_count,
    delete_share_by_token,
)
from ..services.storage_service import stream_file, create_zip_stream
from ..utils.rate_limit import (
    check_query_rate,
    is_ip_locked,
    record_code_failure,
    reset_code_attempts,
)

router = APIRouter(prefix="/share", tags=["share"])


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=CreateShareResponse, status_code=201)
async def create_share_endpoint(
    body: CreateShareRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_ip(request)
    if not check_query_rate(ip):
        raise HTTPException(429, "Rate limit exceeded. Try again later.")

    if not body.upload_ids and not body.text_content:
        raise HTTPException(400, "Share must contain files or text")

    try:
        result = await create_share(db, body)
    except ValueError as e:
        raise HTTPException(400, str(e))

    return result


@router.get("/{code}", response_model=ShareInfo)
async def get_share_info(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_ip(request)

    if is_ip_locked(ip):
        raise HTTPException(429, "Too many failed attempts. Try again later.")
    if not check_query_rate(ip):
        raise HTTPException(429, "Rate limit exceeded. Try again later.")

    share = await get_share(db, code)
    if share is None:
        remaining = record_code_failure(ip)
        raise HTTPException(
            404,
            f"Share not found or expired. {remaining} attempts remaining." if remaining else "Share not found or expired. IP locked for 10 minutes.",
        )

    reset_code_attempts(ip)
    info = build_share_info(share)
    # Hide text content if share has a password (require verify first)
    if share.password_hash is not None:
        info.text_content = None
    return info


@router.post("/{code}/verify")
async def verify_password_endpoint(
    code: str,
    body: VerifyPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_ip(request)
    if is_ip_locked(ip):
        raise HTTPException(429, "Too many failed attempts. Try again later.")

    share = await get_share(db, code)
    if share is None:
        raise HTTPException(404, "Share not found or expired")

    valid = await verify_share_password(share, body.password)
    if not valid:
        remaining = record_code_failure(ip)
        raise HTTPException(
            401,
            f"Wrong password. {remaining} attempts remaining." if remaining else "Wrong password. IP locked.",
        )

    reset_code_attempts(ip)
    info = build_share_info(share)
    return {"valid": True, "share": info}


@router.get("/{code}/download/{file_id}")
async def download_file(
    code: str,
    file_id: int,
    request: Request,
    x_share_password: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    share = await get_share(db, code)
    if share is None:
        raise HTTPException(404, "Share not found or expired")

    # Check max downloads
    if share.max_downloads > 0 and share.download_count >= share.max_downloads:
        raise HTTPException(403, "Download limit reached")

    # Password check
    if share.password_hash is not None:
        if not x_share_password:
            raise HTTPException(401, "Password required (X-Share-Password header)")
        if not await verify_share_password(share, x_share_password):
            raise HTTPException(401, "Wrong password")

    # Find file
    file_record = next((f for f in share.files if f.id == file_id), None)
    if not file_record:
        raise HTTPException(404, "File not found")

    if not os.path.exists(file_record.storage_path):
        raise HTTPException(404, "File missing from storage")

    await increment_download_count(db, share)

    mime = file_record.mime_type or "application/octet-stream"
    filename_encoded = file_record.filename.encode("utf-8").decode("latin-1", errors="replace")

    return StreamingResponse(
        stream_file(file_record.storage_path),
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{filename_encoded}"',
            "Content-Length": str(file_record.size),
        },
    )


@router.get("/{code}/download-all")
async def download_all_files(
    code: str,
    request: Request,
    x_share_password: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    share = await get_share(db, code)
    if share is None:
        raise HTTPException(404, "Share not found or expired")

    if share.max_downloads > 0 and share.download_count >= share.max_downloads:
        raise HTTPException(403, "Download limit reached")

    if share.password_hash is not None:
        if not x_share_password:
            raise HTTPException(401, "Password required")
        if not await verify_share_password(share, x_share_password):
            raise HTTPException(401, "Wrong password")

    if not share.files:
        raise HTTPException(404, "No files in this share")

    await increment_download_count(db, share)

    files_data = [
        {"storage_path": f.storage_path, "filename": f.filename}
        for f in share.files
        if os.path.exists(f.storage_path)
    ]

    return StreamingResponse(
        create_zip_stream(files_data),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="snapsend_{code}.zip"',
        },
    )


@router.delete("/{code}")
async def delete_share_endpoint(
    code: str,
    body: DeleteShareRequest,
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_share_by_token(db, code, body.delete_token)
    if not deleted:
        raise HTTPException(403, "Invalid delete token or share not found")
    return {"message": "Share deleted successfully"}
