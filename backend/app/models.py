from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text

from sqlalchemy.orm import relationship

from .database import Base


class Share(Base):
    __tablename__ = "shares"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    type = Column(String(10), nullable=False)  # file | text | mixed
    text_content = Column(Text, nullable=True)
    password_hash = Column(String(255), nullable=True)
    max_downloads = Column(Integer, default=0)  # 0 = unlimited
    download_count = Column(Integer, default=0)
    expire_at = Column(DateTime, nullable=False)
    delete_token = Column(String(64), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    files = relationship("File", back_populates="share", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(Integer, ForeignKey("shares.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=True)
    storage_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    share = relationship("Share", back_populates="files")
