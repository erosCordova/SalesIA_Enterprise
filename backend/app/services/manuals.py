from fastapi import (
    HTTPException,
    UploadFile,
    status,
)

from app.core.database import engine

from app.repositories import (
    manuals as repository,
)

from app.schemas.manuals import (
    ManualResponse,
)


MAX_MANUAL_SIZE = (
    15
    * 1024
    * 1024
)


VALID_MANUAL_TYPES = {
    "user",
    "technical",
}


def validate_manual_type(
    manual_type: str,
) -> None:
    if (
        manual_type
        not in VALID_MANUAL_TYPES
    ):
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Tipo de manual no válido.",
        )


def list_public_manuals() -> list[
    ManualResponse
]:
    with engine.connect() as connection:
        rows = repository.list_manuals(
            connection,
        )

    return [
        ManualResponse(
            **dict(row)
        )
        for row in rows
    ]


def get_manual_file(
    manual_type: str,
) -> dict:
    validate_manual_type(
        manual_type,
    )

    with engine.connect() as connection:
        row = repository.get_manual(
            connection,
            manual_type,
        )

    if not row:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Manual no disponible.",
        )

    return dict(
        row,
    )


async def save_manual(
    *,
    manual_type: str,
    title: str,
    file: UploadFile | None,
    current_user: dict,
) -> ManualResponse:
    validate_manual_type(
        manual_type,
    )

    clean_title = title.strip()

    if not clean_title:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,

            detail=
                "El título es obligatorio.",
        )

    with engine.connect() as connection:
        existing = repository.get_manual(
            connection,
            manual_type,
        )

    if file is None:
        if not existing:
            raise HTTPException(
                status_code=
                    status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=
                    "Selecciona un archivo PDF.",
            )

        with engine.begin() as connection:
            row = repository.update_manual_title(
                connection,

                manual_type=
                    manual_type,

                title=
                    clean_title,

                updated_by=
                    str(
                        current_user[
                            "id"
                        ]
                    ),
            )

        if not row:
            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    "Manual no encontrado.",
            )

        return ManualResponse(
            **dict(row)
        )

    if (
        file.content_type
        != "application/pdf"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,

            detail=
                "Solo se permiten archivos PDF.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,

            detail=
                "El archivo está vacío.",
        )

    if (
        len(content)
        > MAX_MANUAL_SIZE
    ):
        raise HTTPException(
            status_code=413,

            detail=
                "El PDF no puede superar los 15 MB.",
        )

    if manual_type == "user":
        default_name = (
            "Manual_de_Usuario_"
            "SalesIA_Enterprise.pdf"
        )
    else:
        default_name = (
            "Manual_Tecnico_"
            "SalesIA_Enterprise.pdf"
        )

    file_name = (
        file.filename
        or default_name
    )

    if not file_name.lower().endswith(
        ".pdf"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_422_UNPROCESSABLE_ENTITY,

            detail=
                "El archivo debe tener extensión .pdf.",
        )

    with engine.begin() as connection:
        row = repository.upsert_manual(
            connection,

            manual_type=
                manual_type,

            title=
                clean_title,

            file_name=
                file_name,

            mime_type=
                "application/pdf",

            size_bytes=
                len(content),

            content=
                content,

            updated_by=
                str(
                    current_user[
                        "id"
                    ]
                ),
        )

    return ManualResponse(
        **dict(row)
    )


def remove_manual(
    manual_type: str,
) -> dict:
    validate_manual_type(
        manual_type,
    )

    with engine.begin() as connection:
        deleted = repository.delete_manual(
            connection,
            manual_type,
        )

    if not deleted:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Manual no encontrado.",
        )

    return {
        "message":
            "Manual eliminado correctamente.",
    }
