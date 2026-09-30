from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.statistics import (
    BayesRequest,
    BayesResponse,
)
from app.services.statistics import calculate_bayes


router = APIRouter()


@router.post(
    "/bayes",
    response_model=BayesResponse,
    summary="Calcular Teorema de Bayes",
)
def bayes(
    data: BayesRequest,
    current_user: dict = Depends(
        require_roles(
            "Administrador",
            "Gerente",
            "Analista",
        )
    ),
):
    return calculate_bayes(data)
