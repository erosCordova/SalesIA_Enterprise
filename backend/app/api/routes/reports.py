from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def reports_status():
    return {
        "module": "Reportes",
        "status": "ready",
    }
