from fastapi import APIRouter, Request, HTTPException, Path as FPath
from fastapi.responses import JSONResponse

from ..config import settings
from ..schemas import InitUploadRequest, InitUploadResponse
from ..services.storage_service import (
    init_upload_session,
    get_upload_meta,
    save_chunk,
    is_upload_complete,
)
from ..utils.rate_limit import check_upload_rate

router = APIRouter(prefix="/upload", tags=["upload"])


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/init", response_model=InitUploadResponse)
async def init_upload(body: InitUploadRequest, request: Request):
    ip = _get_ip(request)
    if not check_upload_rate(ip):
        raise HTTPException(429, "Upload rate limit exceeded. Try again later.")

    if body.size > settings.MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large (max {settings.MAX_FILE_SIZE} bytes)")
    if body.total_chunks < 1:
        raise HTTPException(400, "total_chunks must be >= 1")

    upload_id = init_upload_session(
        filename=body.filename,
        size=body.size,
        mime_type=body.mime_type,
        total_chunks=body.total_chunks,
    )
    return InitUploadResponse(upload_id=upload_id)


@router.put("/chunk/{upload_id}/{chunk_index}")
async def upload_chunk(
    upload_id: str,
    chunk_index: int,
    request: Request,
):
    meta = get_upload_meta(upload_id)
    if meta is None:
        raise HTTPException(404, "Upload session not found or expired")

    if chunk_index < 0 or chunk_index >= meta["total_chunks"]:
        raise HTTPException(400, f"chunk_index out of range [0, {meta['total_chunks'] - 1}]")

    data = await request.body()
    if not data:
        raise HTTPException(400, "Empty chunk body")

    ok = await save_chunk(upload_id, chunk_index, data)
    if not ok:
        raise HTTPException(500, "Failed to save chunk")

    meta_updated = get_upload_meta(upload_id)
    received = len(meta_updated["received_chunks"]) if meta_updated else 0
    total = meta["total_chunks"]
    complete = is_upload_complete(upload_id)

    return {
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "received_chunks": received,
        "total_chunks": total,
        "complete": complete,
    }


@router.get("/status/{upload_id}")
async def upload_status(upload_id: str):
    meta = get_upload_meta(upload_id)
    if meta is None:
        raise HTTPException(404, "Upload session not found")
    return {
        "upload_id": upload_id,
        "filename": meta["filename"],
        "size": meta["size"],
        "total_chunks": meta["total_chunks"],
        "received_chunks": len(meta["received_chunks"]),
        "complete": is_upload_complete(upload_id),
    }
