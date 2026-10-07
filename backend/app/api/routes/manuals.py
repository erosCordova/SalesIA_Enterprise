from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
)

from fastapi.responses import StreamingResponse

from app.api.dependencies.auth import require_roles

from app.schemas.manuals import ManualResponse

from app.services.manuals import (
    get_manual_file,
    list_public_manuals,
    remove_manual,
    save_manual,
)


router = APIRouter()


@router.get(
    "/public",
    response_model=list[ManualResponse],
    summary="Listar manuales públicos",
)
def public_manuals():
    return list_public_manuals()


@router.get(
    "/public/{manual_type}/file",
    summary="Visualizar manual",
)
def public_manual_file(
    manual_type: str,
):
    manual = get_manual_file(
        manual_type,
    )

    filename = (
        manual["file_name"]
        .replace(
            '"',
            "",
        )
    )

    return StreamingResponse(
        BytesIO(
            manual["content"],
        ),
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'inline; filename="{filename}"',

            "Cache-Control":
                "no-store",

            "X-Content-Type-Options":
                "nosniff",
        },
    )


@router.put(
    "/{manual_type}",
    response_model=ManualResponse,
    summary="Agregar o actualizar manual",
)
async def put_manual(
    manual_type: str,

    title: str = Form(...),

    file: UploadFile | None = File(
        default=None,
    ),

    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    return await save_manual(
        manual_type=manual_type,
        title=title,
        file=file,
        current_user=current_user,
    )


@router.delete(
    "/{manual_type}",
    summary="Eliminar manual",
)
def delete_manual(
    manual_type: str,

    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
        )
    ),
):
    return remove_manual(
        manual_type,
    )
