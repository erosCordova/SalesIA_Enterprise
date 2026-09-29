from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def auth_status():
    return {
        "module": "Gestión de Acceso y Seguridad",
        "status": "ready",
    }
