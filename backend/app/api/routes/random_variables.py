from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.statistics import (
    RandomVariableRequest,
    RandomVariableResponse,
)
from app.services.statistics import analyze_random_variable


router = APIRouter()


@router.post(
    "/analyze",
    response_model=RandomVariableResponse,
    summary="Analizar variable aleatoria",
)
def analyze(
    data: RandomVariableRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return analyze_random_variable(data)
