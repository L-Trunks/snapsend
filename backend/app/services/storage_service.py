import os
import json
import shutil
import tempfile
import zipfile
from typing import Iterator, List, Optional

import aiofiles

from ..config import settings
from ..utils.code_gen import generate_upload_id


def _ensure_dirs():
    os.makedirs(settings.LOCAL_PATH, exist_ok=True)
    os.makedirs(settings.TEMP_PATH, exist_ok=True)


# ── Chunked upload ─────────────────────────────────────────────────────────────

def init_upload_session(filename: str, size: int, mime_type: Optional[str], total_chunks: int) -> str:
    _ensure_dirs()
    upload_id = generate_upload_id()
    session_dir = os.path.join(settings.TEMP_PATH, upload_id)
    os.makedirs(session_dir, exist_ok=True)
    meta = {
        "filename": filename,
        "size": size,
        "mime_type": mime_type,
        "total_chunks": total_chunks,
        "received_chunks": [],
    }
    with open(os.path.join(session_dir, "meta.json"), "w") as f:
        json.dump(meta, f)
    return upload_id


def get_upload_meta(upload_id: str) -> Optional[dict]:
    meta_path = os.path.join(settings.TEMP_PATH, upload_id, "meta.json")
    if not os.path.exists(meta_path):
        return None
    with open(meta_path, "r") as f:
        return json.load(f)


async def save_chunk(upload_id: str, chunk_index: int, data: bytes) -> bool:
    session_dir = os.path.join(settings.TEMP_PATH, upload_id)
    if not os.path.exists(session_dir):
        return False
    chunk_path = os.path.join(session_dir, f"chunk_{chunk_index:06d}")
    async with aiofiles.open(chunk_path, "wb") as f:
        await f.write(data)
    # Update meta
    meta = get_upload_meta(upload_id)
    if meta is None:
        return False
    if chunk_index not in meta["received_chunks"]:
        meta["received_chunks"].append(chunk_index)
    with open(os.path.join(session_dir, "meta.json"), "w") as f:
        json.dump(meta, f)
    return True


def is_upload_complete(upload_id: str) -> bool:
    meta = get_upload_meta(upload_id)
    if not meta:
        return False
    return len(meta["received_chunks"]) >= meta["total_chunks"]


def assemble_upload(upload_id: str) -> Optional[str]:
    """Assemble all chunks into a single temp file; returns temp file path."""
    meta = get_upload_meta(upload_id)
    if not meta:
        return None
    session_dir = os.path.join(settings.TEMP_PATH, upload_id)
    total_chunks = meta["total_chunks"]
    # Write assembled file to temp location
    assembled_path = os.path.join(session_dir, "assembled")
    with open(assembled_path, "wb") as out:
        for i in range(total_chunks):
            chunk_path = os.path.join(session_dir, f"chunk_{i:06d}")
            if not os.path.exists(chunk_path):
                return None
            with open(chunk_path, "rb") as chunk_file:
                shutil.copyfileobj(chunk_file, out)
    return assembled_path


# ── File storage ───────────────────────────────────────────────────────────────

def store_file(upload_id: str, code: str) -> Optional[dict]:
    """Move assembled upload to permanent storage. Returns file metadata."""
    meta = get_upload_meta(upload_id)
    if not meta:
        return None
    assembled_path = assemble_upload(upload_id)
    if not assembled_path:
        return None

    dest_dir = os.path.join(settings.LOCAL_PATH, code)
    os.makedirs(dest_dir, exist_ok=True)

    # Sanitize filename
    safe_name = os.path.basename(meta["filename"])
    dest_path = os.path.join(dest_dir, safe_name)

    # Handle duplicate filenames
    counter = 1
    base, ext = os.path.splitext(safe_name)
    while os.path.exists(dest_path):
        dest_path = os.path.join(dest_dir, f"{base}_{counter}{ext}")
        counter += 1

    shutil.move(assembled_path, dest_path)

    # Cleanup temp session
    shutil.rmtree(os.path.join(settings.TEMP_PATH, upload_id), ignore_errors=True)

    return {
        "filename": os.path.basename(dest_path),
        "size": meta["size"],
        "mime_type": meta["mime_type"],
        "storage_path": dest_path,
    }


def delete_share_files(code: str) -> None:
    """Delete all files for a share from disk."""
    share_dir = os.path.join(settings.LOCAL_PATH, code)
    if os.path.exists(share_dir):
        shutil.rmtree(share_dir, ignore_errors=True)


# ── Download helpers ───────────────────────────────────────────────────────────

async def stream_file(file_path: str, chunk_size: int = 65536) -> Iterator[bytes]:
    """Async generator to stream a file in chunks."""
    async with aiofiles.open(file_path, "rb") as f:
        while True:
            chunk = await f.read(chunk_size)
            if not chunk:
                break
            yield chunk


def create_zip_stream(files: List[dict]) -> Iterator[bytes]:
    """Create a ZIP of multiple files and stream it via a temp file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp_path = tmp.name

    try:
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
            for f in files:
                if os.path.exists(f["storage_path"]):
                    zf.write(f["storage_path"], f["filename"])
        with open(tmp_path, "rb") as fp:
            while True:
                chunk = fp.read(65536)
                if not chunk:
                    break
                yield chunk
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ── Storage stats ──────────────────────────────────────────────────────────────

def get_storage_used() -> int:
    """Return total bytes used in LOCAL_PATH."""
    total = 0
    if not os.path.exists(settings.LOCAL_PATH):
        return 0
    for dirpath, _, filenames in os.walk(settings.LOCAL_PATH):
        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            try:
                total += os.path.getsize(fpath)
            except OSError:
                pass
    return total


def human_size(size_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"
