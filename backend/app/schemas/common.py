from typing import Any

from pydantic import BaseModel


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
