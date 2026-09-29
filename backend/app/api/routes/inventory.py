from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def inventory_status():
    return {
        "module": "Gestión de Inventario",
        "status": "ready",
    }
