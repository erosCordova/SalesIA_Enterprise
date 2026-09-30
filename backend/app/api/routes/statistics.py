from fastapi import (
    APIRouter,
    Depends,
)

from app.api.dependencies.auth import require_roles
from app.schemas.statistics import (
    CompareStatisticsResponse,
    MeanResponse,
    MedianResponse,
    NumericValuesRequest,
)
from app.services.statistics import (
    calculate_mean,
    calculate_median,
    compare_statistics,
)


router = APIRouter()


def analytics_user():
    return require_roles(
        "Administrador",
        "Gerente",
        "Analista",
    )


@router.post(
    "/mean",
    response_model=MeanResponse,
    summary="Calcular media aritmética",
)
def mean(
    data: NumericValuesRequest,
    current_user: dict = Depends(
        analytics_user()
    ),
):
    return calculate_mean(data)


@router.post(
    "/median",
    response_model=MedianResponse,
    summary="Calcular mediana",
)
def median(
    data: NumericValuesRequest,
    current_user: dict = Depends(
        analytics_user()
    ),
):
    return calculate_median(data)


@router.post(
    "/compare",
    response_model=CompareStatisticsResponse,
    summary="Comparar media y mediana",
)
def compare(
    data: NumericValuesRequest,
    current_user: dict = Depends(
        analytics_user()
    ),
):
    return compare_statistics(data)
