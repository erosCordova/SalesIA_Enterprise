from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.analytics import Dataset, DatasetVariable, Observation, StatisticalAnalysis, StatisticalResult, BayesAnalysis, RandomVariable


def create_dataset(db: Session, company_id: UUID, created_by: Optional[UUID], name: str, description: Optional[str] = None, source_type: str = 'manual', source_reference: Optional[str] = None, status: str = 'active') -> Dataset:
    dataset = Dataset(id=uuid4(), company_id=company_id, created_by=created_by, name=name, description=description, source_type=source_type, source_reference=source_reference, status=status)
    db.add(dataset)
    db.flush()
    return dataset


def create_variable(db: Session, dataset_id: UUID, name: str, variable_type: str, data_type: str, measurement_level: Optional[str] = None, unit: Optional[str] = None, description: Optional[str] = None) -> DatasetVariable:
    variable = DatasetVariable(id=uuid4(), dataset_id=dataset_id, name=name, variable_type=variable_type, data_type=data_type, measurement_level=measurement_level, unit=unit, description=description)
    db.add(variable)
    db.flush()
    return variable


def create_numeric_observations(db: Session, dataset_id: UUID, variable_id: UUID, values: list[float]) -> list[Observation]:
    observations = []
    for index, value in enumerate(values, start=1):
        observation = Observation(id=uuid4(), dataset_id=dataset_id, variable_id=variable_id, observation_index=index, numeric_value=Decimal(str(value)))
        db.add(observation)
        observations.append(observation)
    db.flush()
    return observations


def create_analysis(db: Session, dataset_id: UUID, variable_id: Optional[UUID], executed_by: Optional[UUID], analysis_type: str, name: str, parameters: dict, description: Optional[str] = None) -> StatisticalAnalysis:
    analysis = StatisticalAnalysis(id=uuid4(), dataset_id=dataset_id, variable_id=variable_id, executed_by=executed_by, analysis_type=analysis_type, name=name, description=description, parameters=parameters, status='completed', executed_at=datetime.now(timezone.utc))
    db.add(analysis)
    db.flush()
    return analysis


def create_result(db: Session, analysis_id: UUID, metric_name: str, numeric_value: Optional[float] = None, text_value: Optional[str] = None, interpretation: Optional[str] = None) -> StatisticalResult:
    result = StatisticalResult(id=uuid4(), analysis_id=analysis_id, metric_name=metric_name, numeric_value=Decimal(str(numeric_value)) if numeric_value is not None else None, text_value=text_value, interpretation=interpretation)
    db.add(result)
    db.flush()
    return result


def create_bayes_analysis(db: Session, analysis_id: UUID, event_a: str, event_b: str, probability_a: float, probability_b_given_a: float, probability_b: float, posterior_probability: float, interpretation: str) -> BayesAnalysis:
    result = BayesAnalysis(id=uuid4(), statistical_analysis_id=analysis_id, event_a=event_a, event_b=event_b, probability_a=Decimal(str(probability_a)), probability_b_given_a=Decimal(str(probability_b_given_a)), probability_b=Decimal(str(probability_b)), posterior_probability=Decimal(str(posterior_probability)), interpretation=interpretation)
    db.add(result)
    db.flush()
    return result


def create_random_variable(db: Session, dataset_id: UUID, variable_id: UUID, name: str, variable_kind: str, probability_model: Optional[str] = None, parameters: Optional[dict] = None, description: Optional[str] = None) -> RandomVariable:
    result = RandomVariable(id=uuid4(), dataset_id=dataset_id, variable_id=variable_id, name=name, variable_kind=variable_kind, probability_model=probability_model, parameters=parameters, description=description)
    db.add(result)
    db.flush()
    return result
