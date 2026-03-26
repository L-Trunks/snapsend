import os
import yaml
from typing import List


def _load_config() -> dict:
    config_path = os.environ.get("CONFIG_PATH", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


_cfg = _load_config()


def _get(keys: str, default):
    parts = keys.split(".")
    node = _cfg
    for p in parts:
        if not isinstance(node, dict):
            return default
        node = node.get(p, None)
        if node is None:
            return default
    return node


class Settings:
    # Server
    PORT: int = int(os.environ.get("PORT", _get("server.port", 8080)))
    HOST: str = os.environ.get("HOST", _get("server.host", "0.0.0.0"))
    BASE_URL: str = os.environ.get("BASE_URL", _get("server.base_url", "http://localhost:8080"))

    # Share
    CODE_LENGTH: int = int(_get("share.code_length", 6))
    CODE_CHARSET: str = _get("share.code_charset", "ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
    MAX_FILE_SIZE: int = int(_get("share.max_file_size", 1073741824))
    MAX_FILES_PER_SHARE: int = int(_get("share.max_files_per_share", 10))
    MAX_TEXT_SIZE: int = int(_get("share.max_text_size", 5242880))
    DEFAULT_EXPIRE: int = int(_get("share.default_expire", 86400))
    EXPIRE_OPTIONS: List[int] = _get("share.expire_options", [3600, 21600, 86400, 259200, 604800])
    MAX_EXPIRE: int = int(_get("share.max_expire", 604800))

    # Storage
    STORAGE_TYPE: str = _get("storage.type", "local")
    LOCAL_PATH: str = os.environ.get("STORAGE_PATH", _get("storage.local_path", "./data/files"))
    TEMP_PATH: str = os.environ.get("TEMP_PATH", "./data/tmp")
    CLEANUP_INTERVAL: int = int(_get("storage.cleanup_interval", 600))

    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./data/snapsend.db")

    # Security
    RATE_LIMIT_UPLOAD: int = int(_get("security.rate_limit_upload", 20))
    RATE_LIMIT_QUERY: int = int(_get("security.rate_limit_query", 60))
    MAX_CODE_ATTEMPTS: int = int(_get("security.max_code_attempts", 5))
    LOCKOUT_DURATION: int = int(_get("security.lockout_duration", 600))
    ENABLE_PASSWORD: bool = bool(_get("security.enable_password", True))
    ENABLE_CUSTOM_CODE: bool = bool(_get("security.enable_custom_code", True))

    # CORS
    ALLOWED_ORIGINS: List[str] = os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080"
    ).split(",")


settings = Settings()
