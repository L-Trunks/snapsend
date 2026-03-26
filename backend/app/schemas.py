from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class FileInfo(BaseModel):
    id: int
    filename: str
    size: int
    mime_type: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ShareInfo(BaseModel):
    code: str
    type: str
    text_content: Optional[str] = None
    has_password: bool
    max_downloads: int
    download_count: int
    expire_at: datetime
    created_at: datetime
    files: List[FileInfo] = []
    remaining_seconds: int

    model_config = {"from_attributes": True}


class CreateShareRequest(BaseModel):
    upload_ids: List[str] = []
    text_content: Optional[str] = None
    expire_seconds: int = Field(default=86400, ge=60)
    password: Optional[str] = None
    max_downloads: int = Field(default=0, ge=0)
    custom_code: Optional[str] = None


class CreateShareResponse(BaseModel):
    code: str
    delete_token: str
    expire_at: datetime
    link: str
    qr_code_base64: str


class InitUploadRequest(BaseModel):
    filename: str
    size: int
    mime_type: Optional[str] = None
    total_chunks: int


class InitUploadResponse(BaseModel):
    upload_id: str


class VerifyPasswordRequest(BaseModel):
    password: str


class DeleteShareRequest(BaseModel):
    delete_token: str


class AdminStats(BaseModel):
    active_shares: int
    total_files: int
    storage_used_bytes: int
    storage_used_human: str
    recent_shares: List[dict] = []
