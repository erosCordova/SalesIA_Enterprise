import ipaddress
import json
import logging

from functools import lru_cache
from urllib.parse import quote
from urllib.request import (
    Request as UrlRequest,
    urlopen,
)

from fastapi import Request
from pydantic import BaseModel

from app.core.database import engine
from app.repositories import audit as repository
from app.schemas.audit import AuditLogItem


logger = logging.getLogger(
    __name__
)


def get_audit_logs(
    current_user: dict,
    limit: int = 500,
) -> list[AuditLogItem]:
    company_id = current_user[
        "company_id"
    ]

    with engine.connect() as connection:
        rows = repository.list_audit_logs(
            connection,
            company_id=company_id,
            limit=limit,
        )

    return [
        AuditLogItem(
            **dict(row)
        )
        for row in rows
    ]


def _json_safe(
    value,
):
    if value is None:
        return None

    if isinstance(
        value,
        BaseModel,
    ):
        return value.model_dump(
            mode="json"
        )

    if isinstance(
        value,
        dict,
    ):
        return {
            str(key):
                _json_safe(
                    current,
                )
            for key, current
            in value.items()
        }

    if isinstance(
        value,
        (
            list,
            tuple,
            set,
        ),
    ):
        return [
            _json_safe(
                current
            )
            for current in value
        ]

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    try:
        json.dumps(
            value,
        )

        return value

    except Exception:
        return str(
            value
        )


def snapshot(
    value,
) -> dict | None:
    data = _json_safe(
        value
    )

    if data is None:
        return None

    if isinstance(
        data,
        dict,
    ):
        return data

    return {
        "value":
            data,
    }


def _client_ip(
    request: Request | None,
) -> str | None:
    if request is None:
        return None

    candidates = [
        request.headers.get(
            "cf-connecting-ip"
        ),
        request.headers.get(
            "x-real-ip"
        ),
    ]

    forwarded = (
        request.headers.get(
            "x-forwarded-for"
        )
    )

    if forwarded:
        candidates.insert(
            0,
            forwarded.split(
                ","
            )[0].strip(),
        )

    if request.client:
        candidates.append(
            request.client.host
        )

    for candidate in candidates:
        if not candidate:
            continue

        value = (
            candidate
            .strip()
            .split("%")[0]
        )

        try:
            ipaddress.ip_address(
                value
            )

            return value

        except ValueError:
            continue

    return None


def _public_ip(
    value: str | None,
) -> bool:
    if not value:
        return False

    try:
        parsed = (
            ipaddress.ip_address(
                value
            )
        )

        return not (
            parsed.is_private
            or parsed.is_loopback
            or parsed.is_link_local
            or parsed.is_reserved
            or parsed.is_multicast
        )

    except ValueError:
        return False


@lru_cache(
    maxsize=256,
)
def _lookup_ip_location(
    ip_value: str,
) -> dict:
    if not _public_ip(
        ip_value
    ):
        return {}

    try:
        url = (
            "https://ipwho.is/"
            + quote(
                ip_value,
                safe="",
            )
        )

        request = UrlRequest(
            url,
            headers={
                "User-Agent":
                    "SalesIA-Enterprise-Audit/1.0",
            },
        )

        with urlopen(
            request,
            timeout=2.5,
        ) as response:
            payload = json.loads(
                response
                .read()
                .decode(
                    "utf-8"
                )
            )

        if not payload.get(
            "success",
            True,
        ):
            return {}

        connection = (
            payload.get(
                "connection"
            )
            or {}
        )

        result = {
            "city":
                payload.get(
                    "city"
                ),

            "department":
                payload.get(
                    "region"
                ),

            "country":
                payload.get(
                    "country"
                ),

            "lat":
                payload.get(
                    "latitude"
                ),

            "lng":
                payload.get(
                    "longitude"
                ),

            "isp":
                connection.get(
                    "isp"
                ),

            "location_source":
                "ip",
        }

        return {
            key: value
            for key, value
            in result.items()
            if value not in (
                None,
                "",
            )
        }

    except Exception:
        return {}


def _request_context(
    request: Request | None,
) -> tuple[
    str | None,
    str | None,
    dict,
]:
    if request is None:
        return (
            None,
            None,
            {},
        )

    ip_value = _client_ip(
        request
    )

    user_agent = (
        request.headers.get(
            "user-agent"
        )
        or None
    )

    location = (
        _lookup_ip_location(
            ip_value
        )
        if ip_value
        else {}
    )

    return (
        ip_value,
        user_agent,
        location,
    )


def record_audit_event(
    *,
    action: str,
    table_name: str | None,
    record_id=None,
    current_user: dict | None = None,
    company_id=None,
    user_id=None,
    request: Request | None = None,
    old_data=None,
    new_data=None,
) -> bool:
    if current_user:
        company_id = (
            company_id
            or current_user.get(
                "company_id"
            )
        )

        user_id = (
            user_id
            or current_user.get(
                "id"
            )
        )

    if not company_id:
        logger.warning(
            "Evento de auditoría ignorado: "
            "no se pudo determinar company_id. "
            "Acción=%s",
            action,
        )

        return False

    ip_value, user_agent, context = (
        _request_context(
            request
        )
    )

    safe_old = snapshot(
        old_data
    )

    safe_new = snapshot(
        new_data
    )

    if context:
        if safe_new is None:
            safe_new = {}

        safe_new[
            "_audit_context"
        ] = context

    try:
        with engine.begin() as connection:
            repository.insert_audit_log(
                connection,
                company_id=company_id,
                user_id=user_id,
                action=action,
                table_name=table_name,
                record_id=record_id,
                old_data=safe_old,
                new_data=safe_new,
                ip_address=ip_value,
                user_agent=user_agent,
            )

        return True

    except Exception:
        logger.exception(
            "No se pudo registrar "
            "el evento de auditoría %s.",
            action,
        )

        return False
