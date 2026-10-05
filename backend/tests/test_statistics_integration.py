from collections import defaultdict
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.main import app
from app.models.analytics import (
    BayesAnalysis,
    Dataset,
    DatasetVariable,
    Observation,
    RandomVariable,
    StatisticalAnalysis,
    StatisticalResult,
)


class InMemoryTransaction:
    """Session double that keeps real ORM objects without opening a DB connection."""

    def __init__(self):
        self.pending = []
        self.committed = defaultdict(list)
        self.commit_count = 0

    def add(self, record):
        self.pending.append(record)

    def flush(self):
        # The persistence helpers assign primary keys before flushing.
        return None

    def commit(self):
        for record in self.pending:
            self.committed[type(record)].append(record)
        self.pending.clear()
        self.commit_count += 1


@pytest.fixture
def integrated_client():
    previous_overrides = app.dependency_overrides.copy()
    user_id = uuid4()
    company_id = uuid4()
    transaction = InMemoryTransaction()
    user = {
        "id": user_id,
        "company_id": company_id,
        "role": "Administrador",
    }
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: transaction
    try:
        with TestClient(app) as client:
            yield client, transaction, user_id, company_id
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


def test_statistics_api_integrates_validation_calculation_and_persistence(
    integrated_client,
):
    client, transaction, user_id, company_id = integrated_client

    response = client.post(
        "/api/v1/statistics/compare",
        json={"values": [1, 2, 100]},
    )

    assert response.status_code == 200
    assert response.json()["mean"] == pytest.approx(103 / 3)
    assert response.json()["median"] == pytest.approx(2)
    assert transaction.commit_count == 1

    dataset = transaction.committed[Dataset][0]
    variable = transaction.committed[DatasetVariable][0]
    analysis = transaction.committed[StatisticalAnalysis][0]
    observations = transaction.committed[Observation]
    results = transaction.committed[StatisticalResult]

    assert dataset.company_id == company_id
    assert dataset.created_by == user_id
    assert variable.dataset_id == dataset.id
    assert analysis.dataset_id == dataset.id
    assert analysis.variable_id == variable.id
    assert analysis.analysis_type == "mean_median_comparison"
    assert analysis.parameters == {"values": [1.0, 2.0, 100.0]}
    assert [item.numeric_value for item in observations] == [1, 2, 100]
    assert {item.metric_name for item in results} == {"mean", "median", "difference"}
    assert all(item.analysis_id == analysis.id for item in results)


def test_bayes_api_integrates_calculation_and_bayes_record_creation(
    integrated_client,
):
    client, transaction, user_id, company_id = integrated_client

    response = client.post(
        "/api/v1/probability/bayes",
        json={
            "event_a": "compra",
            "event_b": "promoción",
            "probability_a": 0.01,
            "probability_b_given_a": 0.9,
            "probability_b": 0.05,
        },
    )

    assert response.status_code == 200
    assert response.json()["posterior_probability"] == pytest.approx(0.18)
    assert transaction.commit_count == 1

    dataset = transaction.committed[Dataset][0]
    analysis = transaction.committed[StatisticalAnalysis][0]
    bayes_record = transaction.committed[BayesAnalysis][0]

    assert dataset.company_id == company_id
    assert dataset.created_by == user_id
    assert analysis.dataset_id == dataset.id
    assert analysis.variable_id is None
    assert analysis.analysis_type == "bayes"
    assert bayes_record.statistical_analysis_id == analysis.id
    assert bayes_record.event_a == "compra"
    assert float(bayes_record.posterior_probability) == pytest.approx(0.18)


def test_random_variable_api_integrates_observations_and_distribution_records(
    integrated_client,
):
    client, transaction, user_id, company_id = integrated_client

    response = client.post(
        "/api/v1/random-variables/analyze",
        json={
            "name": "ventas",
            "values": [0, 1, 2],
            "probabilities": [0.25, 0.5, 0.25],
        },
    )

    assert response.status_code == 200
    assert response.json()["expected_value"] == pytest.approx(1)
    assert transaction.commit_count == 1

    dataset = transaction.committed[Dataset][0]
    variable = transaction.committed[DatasetVariable][0]
    analysis = transaction.committed[StatisticalAnalysis][0]
    observations = transaction.committed[Observation]
    random_variable = transaction.committed[RandomVariable][0]
    results = transaction.committed[StatisticalResult]

    assert dataset.company_id == company_id
    assert dataset.created_by == user_id
    assert variable.dataset_id == dataset.id
    assert analysis.dataset_id == dataset.id
    assert analysis.variable_id == variable.id
    assert len(observations) == 3
    assert random_variable.dataset_id == dataset.id
    assert random_variable.variable_id == variable.id
    assert random_variable.parameters == {
        "values": [0.0, 1.0, 2.0],
        "probabilities": [0.25, 0.5, 0.25],
    }
    assert {result.metric_name for result in results} == {
        "expected_value",
        "variance",
        "standard_deviation",
    }
