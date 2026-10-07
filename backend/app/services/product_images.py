from urllib.parse import unquote
from uuid import (
    UUID,
    uuid4,
)

from fastapi import (
    HTTPException,
    UploadFile,
    status,
)
from supabase import create_client

from app.core.config import settings
from app.core.database import engine
from app.repositories import (
    commercial as repository,
)
from app.schemas.commercial import (
    ProductResponse,
)


PRODUCT_IMAGES_BUCKET = (
    "product-images"
)

MAX_IMAGE_BYTES = (
    5 * 1024 * 1024
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _supabase_client():
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )


def _ensure_bucket(
    supabase,
) -> None:
    try:
        supabase.storage.get_bucket(
            PRODUCT_IMAGES_BUCKET,
        )

        return

    except Exception:
        pass

    try:
        supabase.storage.create_bucket(
            PRODUCT_IMAGES_BUCKET,
            options={
                "public": True,
                "allowed_mime_types": [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                ],
                "file_size_limit":
                    MAX_IMAGE_BYTES,
            },
        )

    except Exception as error:
        try:
            supabase.storage.get_bucket(
                PRODUCT_IMAGES_BUCKET,
            )

            return

        except Exception:
            raise HTTPException(
                status_code=
                    status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "No se pudo preparar "
                    "el almacenamiento de "
                    "imágenes."
                ),
            ) from error


def _storage_path_from_url(
    image_url: str | None,
) -> str | None:
    if not image_url:
        return None

    marker = (
        "/storage/v1/object/public/"
        f"{PRODUCT_IMAGES_BUCKET}/"
    )

    if marker not in image_url:
        return None

    value = image_url.split(
        marker,
        1,
    )[1]

    value = value.split(
        "?",
        1,
    )[0]

    return unquote(value)


def upload_product_image(
    product_id: UUID,
    image: UploadFile,
    current_user: dict,
) -> ProductResponse:
    company_id = (
        current_user["company_id"]
    )

    with engine.connect() as connection:
        product = repository.get_product(
            connection,
            company_id,
            product_id,
        )

    if not product:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=(
                "Producto no encontrado."
            ),
        )

    content_type = (
        image.content_type
        or ""
    ).lower()

    extension = (
        ALLOWED_IMAGE_TYPES.get(
            content_type,
        )
    )

    if not extension:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Formato de imagen no "
                "permitido. Usa JPG, PNG "
                "o WEBP."
            ),
        )

    content = image.file.read(
        MAX_IMAGE_BYTES + 1,
    )

    if not content:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "La imagen está vacía."
            ),
        )

    if (
        len(content)
        > MAX_IMAGE_BYTES
    ):
        raise HTTPException(
            status_code=
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "La imagen no puede "
                "superar 5 MB."
            ),
        )

    supabase = _supabase_client()

    _ensure_bucket(
        supabase,
    )

    object_path = (
        f"{company_id}/"
        f"{product_id}/"
        f"{uuid4().hex}"
        f"{extension}"
    )

    storage = (
        supabase
        .storage
        .from_(
            PRODUCT_IMAGES_BUCKET
        )
    )

    try:
        storage.upload(
            path=object_path,
            file=content,
            file_options={
                "content-type":
                    content_type,
                "cache-control":
                    "3600",
                "upsert":
                    "false",
            },
        )

        public_url = (
            storage.get_public_url(
                object_path
            )
        )

        if isinstance(
            public_url,
            str,
        ):
            image_url = public_url

        elif isinstance(
            public_url,
            dict,
        ):
            image_url = (
                public_url.get(
                    "publicUrl"
                )
                or public_url.get(
                    "public_url"
                )
                or ""
            )

        else:
            image_url = str(
                public_url
            )

        if not image_url:
            raise RuntimeError(
                "No se obtuvo la URL pública."
            )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=
                status.HTTP_502_BAD_GATEWAY,
            detail=(
                "No se pudo subir "
                "la imagen del producto."
            ),
        ) from error

    old_image_url = (
        product["image_url"]
        if "image_url" in product
        else None
    )

    try:
        with engine.begin() as connection:
            repository.update_product_image(
                connection,
                company_id,
                product_id,
                image_url,
            )

            updated = (
                repository.get_product(
                    connection,
                    company_id,
                    product_id,
                )
            )

        if not updated:
            raise RuntimeError(
                "No se pudo recuperar "
                "el producto actualizado."
            )

    except Exception as error:
        try:
            storage.remove(
                [
                    object_path,
                ],
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "La imagen se subió, "
                "pero no se pudo asociar "
                "al producto."
            ),
        ) from error

    old_object_path = (
        _storage_path_from_url(
            old_image_url,
        )
    )

    if (
        old_object_path
        and old_object_path
        != object_path
    ):
        try:
            storage.remove(
                [
                    old_object_path,
                ],
            )
        except Exception:
            pass

    return ProductResponse(
        **dict(updated),
    )
