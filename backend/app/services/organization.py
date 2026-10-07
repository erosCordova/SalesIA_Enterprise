from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.core.database import engine
from app.repositories import organization as repository
from app.schemas.organization import (
    BranchCreateRequest,
    BranchResponse,
    BranchUpdateRequest,
    CompanyResponse,
    CompanyUpdateRequest,
)


def clean_optional(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    value = value.strip()

    return value or None


def get_current_company(
    current_user: dict,
) -> CompanyResponse:
    company_id = current_user["company_id"]

    with engine.connect() as connection:
        row = repository.get_company(
            connection,
            company_id,
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada.",
        )

    return CompanyResponse(
        **dict(row)
    )


def update_current_company(
    data: CompanyUpdateRequest,
    current_user: dict,
) -> CompanyResponse:
    company_id = current_user["company_id"]

    values = data.model_dump(
        exclude_unset=True,
    )

    for key in (
        "name",
        "business_name",
        "tax_id",
        "email",
        "phone",
        "address",
        "city",
        "country",
    ):
        if key in values:
            values[key] = clean_optional(
                values[key]
            )

    if (
        "name" in values
        and not values["name"]
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre de la empresa es obligatorio.",
        )

    try:
        with engine.begin() as connection:
            row = repository.update_company(
                connection,
                company_id,
                values,
            )

    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No fue posible actualizar la empresa."
            ),
        ) from exc

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada.",
        )

    return CompanyResponse(
        **dict(row)
    )


def get_branches(
    current_user: dict,
) -> list[BranchResponse]:
    company_id = current_user["company_id"]

    with engine.connect() as connection:
        rows = repository.list_branches(
            connection,
            company_id,
        )

    return [
        BranchResponse(
            **dict(row)
        )
        for row in rows
    ]


def create_branch(
    data: BranchCreateRequest,
    current_user: dict,
) -> BranchResponse:
    company_id = current_user["company_id"]

    code = data.code.strip()
    name = data.name.strip()

    with engine.begin() as connection:
        existing = (
            repository.find_branch_by_code(
                connection,
                company_id,
                code,
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Ya existe una sucursal "
                    "con ese código."
                ),
            )

        row = repository.create_branch(
            connection,
            company_id=company_id,
            code=code,
            name=name,
            address=clean_optional(
                data.address
            ),
            city=clean_optional(
                data.city
            ),
            department=clean_optional(
                data.department
            ),
            province=clean_optional(
                data.province
            ),
            district=clean_optional(
                data.district
            ),
            latitude=data.latitude,
            longitude=data.longitude,
            country=clean_optional(
                data.country
            ),
            phone=clean_optional(
                data.phone
            ),
            email=clean_optional(
                data.email
            ),
            status=data.status,
        )

    return BranchResponse(
        **dict(row)
    )


def update_branch(
    branch_id: UUID,
    data: BranchUpdateRequest,
    current_user: dict,
) -> BranchResponse:
    company_id = current_user["company_id"]

    values = data.model_dump(
        exclude_unset=True,
    )

    for key in (
        "code",
        "name",
        "address",
        "city",
        "department",
        "province",
        "district",
        "country",
        "phone",
        "email",
    ):
        if key in values:
            values[key] = clean_optional(
                values[key]
            )

    if (
        "code" in values
        and not values["code"]
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El código es obligatorio.",
        )

    if (
        "name" in values
        and not values["name"]
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre es obligatorio.",
        )

    try:
        with engine.begin() as connection:
            row = repository.update_branch(
                connection,
                company_id=company_id,
                branch_id=branch_id,
                values=values,
            )

    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ya existe una sucursal "
                "con ese código."
            ),
        ) from exc

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sucursal no encontrada.",
        )

    return BranchResponse(
        **dict(row)
    )
