from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.core.database import get_db
from app.schemas.statistics import RandomVariableRequest, RandomVariableResponse
from app.services.statistics import analyze_random_variable
from app.services.statistical_persistence import create_dataset, create_variable, create_numeric_observations, create_analysis, create_result, create_random_variable

router = APIRouter()

@router.post("/analyze", response_model=RandomVariableResponse, summary="Analizar variable aleatoria")
def analyze(data: RandomVariableRequest, current_user: dict = Depends(require_roles("Administrador", "Gerente", "Analista")), db: Session = Depends(get_db)):
    result = analyze_random_variable(data)
    dataset = create_dataset(db=db, company_id=current_user["company_id"], created_by=current_user["id"], name="Variable aleatoria", description="Análisis de variable aleatoria y distribución de probabilidades.", source_type="random_variable_api")
    variable = create_variable(db=db, dataset_id=dataset.id, name=data.name, variable_type="quantitative", data_type="decimal", measurement_level="ratio", description="Valores de la variable aleatoria.")
    create_numeric_observations(db=db, dataset_id=dataset.id, variable_id=variable.id, values=data.values)
    analysis = create_analysis(db=db, dataset_id=dataset.id, variable_id=variable.id, executed_by=current_user["id"], analysis_type="random_variable", name=data.name, parameters={"values": data.values, "probabilities": data.probabilities})
    create_result(db, analysis.id, "expected_value", numeric_value=result.expected_value)
    create_result(db, analysis.id, "variance", numeric_value=result.variance)
    create_result(db, analysis.id, "standard_deviation", numeric_value=result.standard_deviation)
    create_random_variable(db=db, dataset_id=dataset.id, variable_id=variable.id, name=data.name, variable_kind="discrete", probability_model="empirical", parameters={"values": data.values, "probabilities": data.probabilities}, description="Variable aleatoria discreta registrada por la API.")
    db.commit()
    return result
