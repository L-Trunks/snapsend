import random
import secrets
import string


def generate_code(charset: str, length: int) -> str:
    """Generate a random code using the given charset and length."""
    return "".join(random.choices(charset, k=length))


def generate_delete_token() -> str:
    """Generate a secure random delete token."""
    return secrets.token_hex(32)


def generate_upload_id() -> str:
    """Generate a unique upload session ID."""
    return secrets.token_urlsafe(24)
