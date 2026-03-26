import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List

from ..config import settings

_lock = Lock()

# {ip: [timestamp, ...]}  — for upload/query rate limiting
_upload_log: Dict[str, List[float]] = defaultdict(list)
_query_log: Dict[str, List[float]] = defaultdict(list)

# {ip: {attempts: int, locked_until: float}}  — for code bruteforce prevention
_code_attempts: Dict[str, dict] = {}


def _clean_window(timestamps: List[float], window: float) -> List[float]:
    now = time.time()
    return [t for t in timestamps if now - t < window]


def check_upload_rate(ip: str) -> bool:
    """Returns True if the IP is within upload rate limits."""
    with _lock:
        _upload_log[ip] = _clean_window(_upload_log[ip], 3600)
        if len(_upload_log[ip]) >= settings.RATE_LIMIT_UPLOAD:
            return False
        _upload_log[ip].append(time.time())
        return True


def check_query_rate(ip: str) -> bool:
    """Returns True if the IP is within query rate limits."""
    with _lock:
        _query_log[ip] = _clean_window(_query_log[ip], 60)
        if len(_query_log[ip]) >= settings.RATE_LIMIT_QUERY:
            return False
        _query_log[ip].append(time.time())
        return True


def is_ip_locked(ip: str) -> bool:
    """Returns True if the IP is locked due to too many wrong code attempts."""
    with _lock:
        data = _code_attempts.get(ip)
        if not data:
            return False
        if data.get("locked_until", 0) > time.time():
            return True
        return False


def record_code_failure(ip: str) -> int:
    """Record a failed code attempt; returns remaining attempts before lockout."""
    with _lock:
        if ip not in _code_attempts:
            _code_attempts[ip] = {"attempts": 0, "locked_until": 0}
        data = _code_attempts[ip]
        # Reset if previous lockout has expired
        if data.get("locked_until", 0) < time.time():
            data["attempts"] = 0
        data["attempts"] += 1
        remaining = settings.MAX_CODE_ATTEMPTS - data["attempts"]
        if data["attempts"] >= settings.MAX_CODE_ATTEMPTS:
            data["locked_until"] = time.time() + settings.LOCKOUT_DURATION
            data["attempts"] = 0
            return 0
        return remaining


def reset_code_attempts(ip: str) -> None:
    """Reset code attempt counter after a successful lookup."""
    with _lock:
        _code_attempts.pop(ip, None)
