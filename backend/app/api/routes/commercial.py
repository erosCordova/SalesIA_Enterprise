from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/status", dependencies=[Depends(get_current_user)])
def commercial_status():
    return {
        "module": "Gestión Comercial",
        "status": "ready",
    }
