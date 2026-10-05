"""Acceptance scenarios written from the perspective of a SalesIA user."""

from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.api.routes import probability, random_variables, statistics
from app.core.database import get_db
from app.main import app


class IsolatedSession:
    """Record commits without connecting to or changing a real database."""

    def __init__(self):
        self.commits = 0

    def commit(self):
        self.commits += 1


@pytest.fixture
def acceptance_client(monkeypatch):
    previous_overrides = app.dependency_overrides.copy()
    db = IsolatedSession()
    user = {
        "id": uuid4(),
        "company_id": uuid4(),
        "role": "Administrador",
    }
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db

    def record(*args, **kwargs):
        return SimpleNamespace(id=uuid4())

    def no_op(*args, **kwargs):
        return None

    monkeypatch.setattr(statistics, "persist_numeric_analysis", record)
    monkeypatch.setattr(statistics, "create_result", no_op)
    monkeypatch.setattr(probability, "create_dataset", record)
    monkeypatch.setattr(probability, "create_analysis", record)
    monkeypatch.setattr(probability, "create_bayes_analysis", no_op)
    monkeypatch.setattr(random_variables, "create_dataset", record)
    monkeypatch.setattr(random_variables, "create_variable", record)
    monkeypatch.setattr(random_variables, "create_numeric_observations", no_op)
    monkeypatch.setattr(random_variables, "create_analysis", record)
    monkeypatch.setattr(random_variables, "create_result", no_op)
    monkeypatch.setattr(random_variables, "create_random_variable", no_op)

    try:
        with TestClient(app) as client:
            yield client, db
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


def test_acceptance_user_can_understand_sales_statistics(acceptance_client):
    """A user supplies sales and receives a readable comparison."""
    client, db = acceptance_client

    response = client.post(
        "/api/v1/statistics/compare",
        json={"values": [100, 120, 260]},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["count"] == 3
    assert result["mean"] == pytest.approx(160)
    assert result["median"] == pytest.approx(120)
    assert result["difference"] == pytest.approx(40)
    assert "valores altos pueden estar elevando el promedio" in result["interpretation"]
    assert db.commits == 1


def test_acceptance_user_can_interpret_bayes_probability(acceptance_client):
    """A user sees the posterior and a sentence naming both events."""
    client, db = acceptance_client

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
    result = response.json()
    assert result["posterior_probability"] == pytest.approx(0.18)
    assert result["formula"] == "P(A|B) = P(B|A) × P(A) / P(B)"
    assert "compra dado promoción" in result["interpretation"]
    assert db.commits == 1


def test_acceptance_user_can_read_random_variable_measures(acceptance_client):
    """A user receives named, understandable distribution measures."""
    client, db = acceptance_client

    response = client.post(
        "/api/v1/random-variables/analyze",
        json={
            "name": "unidades vendidas",
            "values": [0, 1, 2],
            "probabilities": [0.25, 0.5, 0.25],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["name"] == "unidades vendidas"
    assert result["observations"] == 3
    assert result["expected_value"] == pytest.approx(1)
    assert result["variance"] == pytest.approx(0.5)
    assert result["standard_deviation"] == pytest.approx(0.5**0.5)
    assert db.commits == 1


def test_acceptance_invalid_input_is_rejected_without_saving(acceptance_client):
    """A user is told that an empty dataset is invalid; nothing is committed."""
    client, db = acceptance_client

    response = client.post(
        "/api/v1/statistics/compare",
        json={"values": []},
    )

    assert response.status_code == 422
    assert response.json()["detail"]
    assert db.commits == 0
