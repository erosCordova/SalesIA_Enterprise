from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def dashboard_status():
    return {
        "module": "Dashboard Ejecutivo",
        "status": "ready",
    }
