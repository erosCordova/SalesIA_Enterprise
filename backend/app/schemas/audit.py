from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AuditLogItem(BaseModel):
    id: UUID

    company_id: UUID | None
    user_id: UUID | None

    user_name: str
    user_role: str | None

    action: str

    table_name: str | None
    record_id: UUID | None

    old_data: dict[str, Any] | None
    new_data: dict[str, Any] | None

    ip_address: str | None
    user_agent: str | None

    created_at: datetime
