from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.core.database import get_db
from app.schemas.statistics import BayesRequest, BayesResponse
from app.services.statistics import calculate_bayes
from app.services.statistical_persistence import create_dataset, create_analysis, create_bayes_analysis

router = APIRouter()

@router.post("/bayes", response_model=BayesResponse, summary="Calcular Teorema de Bayes")
def bayes(data: BayesRequest, current_user: dict = Depends(require_roles("Administrador", "Gerente", "Analista")), db: Session = Depends(get_db)):
    result = calculate_bayes(data)
    dataset = create_dataset(db=db, company_id=current_user["company_id"], created_by=current_user["id"], name="Análisis de Bayes", description="Cálculo de probabilidad posterior mediante Bayes.", source_type="probability_api")
    analysis = create_analysis(db=db, dataset_id=dataset.id, variable_id=None, executed_by=current_user["id"], analysis_type="bayes", name="Teorema de Bayes", parameters={"event_a": data.event_a, "event_b": data.event_b, "probability_a": data.probability_a, "probability_b_given_a": data.probability_b_given_a, "probability_b": data.probability_b})
    create_bayes_analysis(db=db, analysis_id=analysis.id, event_a=result.event_a, event_b=result.event_b, probability_a=result.probability_a, probability_b_given_a=result.probability_b_given_a, probability_b=result.probability_b, posterior_probability=result.posterior_probability, interpretation=result.interpretation)
    db.commit()
    return result
