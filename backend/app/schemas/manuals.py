from datetime import datetime
from typing import Literal

from pydantic import BaseModel


ManualType = Literal[
    "user",
    "technical",
]


class ManualResponse(BaseModel):
    manual_type: ManualType

    title: str

    file_name: str
    mime_type: str
    size_bytes: int

    created_at: datetime
    updated_at: datetime
