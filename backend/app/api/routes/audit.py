from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def audit_status():
    return {
        "module": "Auditoría y Trazabilidad",
        "status": "ready",
    }
