from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.core.database import get_db
from app.schemas.statistics import CompareStatisticsResponse, MeanResponse, MedianResponse, NumericValuesRequest
from app.services.statistics import calculate_mean, calculate_median, compare_statistics
from app.services.statistical_persistence import create_dataset, create_variable, create_numeric_observations, create_analysis, create_result

router = APIRouter()

def analytics_user():
    return require_roles("Administrador", "Gerente", "Analista")

def persist_numeric_analysis(db, current_user, data, result, analysis_type, name):
    dataset = create_dataset(db=db, company_id=current_user["company_id"], created_by=current_user["id"], name=name, source_type="statistics_api")
    variable = create_variable(db=db, dataset_id=dataset.id, name="Valores analizados", variable_type="quantitative", data_type="decimal", measurement_level="ratio")
    create_numeric_observations(db=db, dataset_id=dataset.id, variable_id=variable.id, values=data.values)
    analysis = create_analysis(db=db, dataset_id=dataset.id, variable_id=variable.id, executed_by=current_user["id"], analysis_type=analysis_type, name=name, parameters={"values": data.values})
    return analysis

@router.post("/mean", response_model=MeanResponse, summary="Calcular media aritmética")
def mean(data: NumericValuesRequest, current_user: dict = Depends(analytics_user()), db: Session = Depends(get_db)):
    result = calculate_mean(data)
    analysis = persist_numeric_analysis(db, current_user, data, result, "mean", "Media aritmética")
    create_result(db, analysis.id, "mean", numeric_value=result.mean)
    db.commit()
    return result

@router.post("/median", response_model=MedianResponse, summary="Calcular mediana")
def median(data: NumericValuesRequest, current_user: dict = Depends(analytics_user()), db: Session = Depends(get_db)):
    result = calculate_median(data)
    analysis = persist_numeric_analysis(db, current_user, data, result, "median", "Mediana")
    create_result(db, analysis.id, "median", numeric_value=result.median)
    db.commit()
    return result

@router.post("/compare", response_model=CompareStatisticsResponse, summary="Comparar media y mediana")
def compare(data: NumericValuesRequest, current_user: dict = Depends(analytics_user()), db: Session = Depends(get_db)):
    result = compare_statistics(data)
    analysis = persist_numeric_analysis(db, current_user, data, result, "mean_median_comparison", "Comparación media y mediana")
    create_result(db, analysis.id, "mean", numeric_value=result.mean)
    create_result(db, analysis.id, "median", numeric_value=result.median)
    create_result(db, analysis.id, "difference", numeric_value=result.difference, interpretation=result.interpretation)
    db.commit()
    return result
