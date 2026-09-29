from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def commercial_status():
    return {
        "module": "Gestión Comercial",
        "status": "ready",
    }
