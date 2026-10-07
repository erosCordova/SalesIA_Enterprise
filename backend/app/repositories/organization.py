from uuid import UUID

from sqlalchemy import text
from sqlalchemy.engine import Connection


COMPANY_UPDATE_FIELDS = {
    "name",
    "business_name",
    "tax_id",
    "email",
    "phone",
    "address",
    "city",
    "country",
    "status",
}


BRANCH_UPDATE_FIELDS = {
    "code",
    "name",
    "address",
    "city",
    "department",
    "province",
    "district",
    "latitude",
    "longitude",
    "country",
    "phone",
    "email",
    "status",
}


BRANCH_SELECT = """
    id,
    company_id,
    code,
    name,
    address,
    city,
    department,
    province,
    district,
    latitude,
    longitude,
    country,
    phone,
    email,
    status,
    created_at,
    updated_at
"""


def get_company(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text("""
            SELECT
                id,
                name,
                business_name,
                tax_id,
                email,
                phone,
                address,
                city,
                country,
                status,
                created_at,
                updated_at
            FROM companies
            WHERE id = :company_id
            LIMIT 1
        """),
        {
            "company_id": company_id,
        },
    ).mappings().first()


def update_company(
    connection: Connection,
    company_id: UUID,
    values: dict,
):
    clean_values = {
        key: value
        for key, value in values.items()
        if key in COMPANY_UPDATE_FIELDS
    }

    if not clean_values:
        return get_company(
            connection,
            company_id,
        )

    assignments = [
        f"{key} = :{key}"
        for key in clean_values
    ]

    assignments.append(
        "updated_at = now()"
    )

    params = {
        **clean_values,
        "company_id": company_id,
    }

    return connection.execute(
        text(
            f"""
            UPDATE companies
            SET {", ".join(assignments)}
            WHERE id = :company_id
            RETURNING
                id,
                name,
                business_name,
                tax_id,
                email,
                phone,
                address,
                city,
                country,
                status,
                created_at,
                updated_at
            """
        ),
        params,
    ).mappings().first()


def list_branches(
    connection: Connection,
    company_id: UUID,
):
    return connection.execute(
        text(
            f"""
            SELECT
                {BRANCH_SELECT}
            FROM branches
            WHERE company_id = :company_id
            ORDER BY
                name,
                code
            """
        ),
        {
            "company_id": company_id,
        },
    ).mappings().all()


def find_branch_by_code(
    connection: Connection,
    company_id: UUID,
    code: str,
):
    return connection.execute(
        text(
            f"""
            SELECT
                {BRANCH_SELECT}
            FROM branches
            WHERE company_id = :company_id
              AND lower(code) = lower(:code)
            LIMIT 1
            """
        ),
        {
            "company_id": company_id,
            "code": code,
        },
    ).mappings().first()


def get_branch(
    connection: Connection,
    company_id: UUID,
    branch_id: UUID,
):
    return connection.execute(
        text(
            f"""
            SELECT
                {BRANCH_SELECT}
            FROM branches
            WHERE id = :branch_id
              AND company_id = :company_id
            LIMIT 1
            """
        ),
        {
            "branch_id": branch_id,
            "company_id": company_id,
        },
    ).mappings().first()


def create_branch(
    connection: Connection,
    *,
    company_id: UUID,
    code: str,
    name: str,
    address: str | None,
    city: str | None,
    department: str | None,
    province: str | None,
    district: str | None,
    latitude: float | None,
    longitude: float | None,
    country: str | None,
    phone: str | None,
    email: str | None,
    status: str,
):
    return connection.execute(
        text("""
            INSERT INTO branches (
                company_id,
                code,
                name,
                address,
                city,
                department,
                province,
                district,
                latitude,
                longitude,
                country,
                phone,
                email,
                status
            )
            VALUES (
                :company_id,
                :code,
                :name,
                :address,
                :city,
                :department,
                :province,
                :district,
                :latitude,
                :longitude,
                :country,
                :phone,
                :email,
                :status
            )
            RETURNING
                id,
                company_id,
                code,
                name,
                address,
                city,
                department,
                province,
                district,
                latitude,
                longitude,
                country,
                phone,
                email,
                status,
                created_at,
                updated_at
        """),
        {
            "company_id": company_id,
            "code": code,
            "name": name,
            "address": address,
            "city": city,
            "department": department,
            "province": province,
            "district": district,
            "latitude": latitude,
            "longitude": longitude,
            "country": country,
            "phone": phone,
            "email": email,
            "status": status,
        },
    ).mappings().one()


def update_branch(
    connection: Connection,
    *,
    company_id: UUID,
    branch_id: UUID,
    values: dict,
):
    clean_values = {
        key: value
        for key, value in values.items()
        if key in BRANCH_UPDATE_FIELDS
    }

    if not clean_values:
        return get_branch(
            connection,
            company_id,
            branch_id,
        )

    assignments = [
        f"{key} = :{key}"
        for key in clean_values
    ]

    assignments.append(
        "updated_at = now()"
    )

    params = {
        **clean_values,
        "company_id": company_id,
        "branch_id": branch_id,
    }

    return connection.execute(
        text(
            f"""
            UPDATE branches
            SET {", ".join(assignments)}
            WHERE id = :branch_id
              AND company_id = :company_id
            RETURNING
                {BRANCH_SELECT}
            """
        ),
        params,
    ).mappings().first()
