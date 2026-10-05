import re
from typing import Any

from pydantic import BaseModel


_EMAIL_PATTERN = re.compile(
    r"^[^@\s]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+"
    r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$",
    re.IGNORECASE,
)


def strip_string_fields(value: Any) -> Any:
    """Trim text values in request payloads without changing non-text data."""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return [strip_string_fields(item) for item in value]
    if isinstance(value, dict):
        return {
            key: strip_string_fields(item)
            for key, item in value.items()
        }
    return value


def validate_optional_email(value: Any) -> Any:
    """Normalize an optional email and reject malformed non-empty values."""
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    value = value.strip()
    if not value:
        return None
    if not _EMAIL_PATTERN.fullmatch(value):
        raise ValueError("Ingrese un correo electrónico válido.")
    return value


class MessageResponse(BaseModel):
    message: str


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Any | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: str | None = None
