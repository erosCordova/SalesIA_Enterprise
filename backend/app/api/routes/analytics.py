
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.core.database import get_db
from app.schemas.reporting import AnalyticsDashboardResponse
from app.schemas.statistics import (
    CompareStatisticsResponse,
    MeanResponse,
    MedianResponse,
    NumericValuesRequest,
    SalesStatisticsRequest,
    SalesStatisticsResponse,
)
from app.services.analytics import (
    get_analytics_dashboard,
    get_completed_sale_totals,
)
from app.services.statistics import compare_statistics
from app.services.statistical_persistence import (
    create_dataset,
    create_variable,
    create_numeric_observations,
    create_analysis,
    create_result,
)

router = APIRouter()


def analytics_user():
    return require_roles("Administrador", "Gerente", "Analista")


def persist_numeric_analysis(
    db,
    current_user,
    data,
    result,
    analysis_type,
    name,
):
    dataset = create_dataset(
        db=db,
        company_id=current_user["company_id"],
        created_by=current_user["id"],
        name=name,
        source_type="statistics_api",
    )

    variable = create_variable(
        db=db,
        dataset_id=dataset.id,
        name="Valores analizados",
        variable_type="quantitative",
        data_type="decimal",
        measurement_level="ratio",
    )

    create_numeric_observations(
        db=db,
        dataset_id=dataset.id,
        variable_id=variable.id,
        values=data.values,
    )

    analysis = create_analysis(
        db=db,
        dataset_id=dataset.id,
        variable_id=variable.id,
        executed_by=current_user["id"],
        analysis_type=analysis_type,
        name=name,
        parameters={"values": data.values},
    )

    return analysis


@router.get("/status")
def analytics_status():
    return {
        "module": "Analytics",
        "status": "ready",
    }


@router.get(
    "/dashboard",
    response_model=AnalyticsDashboardResponse,
    summary="Consultar dashboard analítico",
)
def analytics_dashboard(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: dict = Depends(analytics_user()),
):
    return get_analytics_dashboard(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )


@router.post(
    "/sales-analysis",
    response_model=SalesStatisticsResponse,
    summary="Analizar estadísticamente las ventas",
)
def analyze_sales(
    data: SalesStatisticsRequest,
    current_user: dict = Depends(analytics_user()),
    db: Session = Depends(get_db),
):
    values = get_completed_sale_totals(
        current_user=current_user,
        start_date=data.start_date,
        end_date=data.end_date,
    )

    if not values:
        raise HTTPException(
            status_code=404,
            detail="No hay ventas completadas en el período seleccionado.",
        )

    numeric_data = NumericValuesRequest(values=values)
    result = compare_statistics(numeric_data)

    analysis = persist_numeric_analysis(
        db=db,
        current_user=current_user,
        data=numeric_data,
        result=result,
        analysis_type="sales_analysis",
        name="Análisis estadístico de ventas",
    )

    create_result(
        db=db,
        analysis_id=analysis.id,
        metric_name="mean",
        numeric_value=result.mean,
    )

    create_result(
        db=db,
        analysis_id=analysis.id,
        metric_name="median",
        numeric_value=result.median,
    )

    create_result(
        db=db,
        analysis_id=analysis.id,
        metric_name="difference",
        numeric_value=result.difference,
        interpretation=result.interpretation,
    )

    db.commit()

    return SalesStatisticsResponse(
        start_date=data.start_date,
        end_date=data.end_date,
        count=result.count,
        mean=result.mean,
        median=result.median,
        difference=result.difference,
        interpretation=result.interpretation,
    )
