from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.api.routes import probability, random_variables, statistics
from app.core.database import get_db
from app.main import app


class FakeSession:
    def __init__(self):
        self.committed = False

    def commit(self):
        self.committed = True


@pytest.fixture
def api_client():
    previous_overrides = app.dependency_overrides.copy()
    db = FakeSession()
    test_user = {"id": "test-user", "company_id": "test-company", "role": "Administrador"}

    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[get_db] = lambda: db

    try:
        with TestClient(app) as client:
            yield client, db
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.fixture
def mock_persistence(monkeypatch):
    def fake_analysis(*args, **kwargs):
        return SimpleNamespace(id="test-analysis")

    def fake_dataset(*args, **kwargs):
        return SimpleNamespace(id="test-dataset")

    def fake_variable(*args, **kwargs):
        return SimpleNamespace(id="test-variable")

    def no_op(*args, **kwargs):
        return None

    monkeypatch.setattr(statistics, "persist_numeric_analysis", fake_analysis)
    monkeypatch.setattr(statistics, "create_result", no_op)
    monkeypatch.setattr(probability, "create_dataset", fake_dataset)
    monkeypatch.setattr(probability, "create_analysis", fake_analysis)
    monkeypatch.setattr(probability, "create_bayes_analysis", no_op)
    monkeypatch.setattr(random_variables, "create_dataset", fake_dataset)
    monkeypatch.setattr(random_variables, "create_variable", fake_variable)
    monkeypatch.setattr(random_variables, "create_numeric_observations", no_op)
    monkeypatch.setattr(random_variables, "create_analysis", fake_analysis)
    monkeypatch.setattr(random_variables, "create_result", no_op)
    monkeypatch.setattr(random_variables, "create_random_variable", no_op)


def test_health_endpoint_is_public_and_reports_api_availability():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_endpoint_rejects_missing_credentials():
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={})

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("path", "values", "expected"),
    [
        ("/api/v1/statistics/mean", [2, 4, 9], {"count": 3, "mean": 5}),
        ("/api/v1/statistics/median", [9, 1, 4], {"count": 3, "median": 4}),
        (
            "/api/v1/statistics/compare",
            [1, 2, 100],
            {
                "count": 3,
                "mean": pytest.approx(103 / 3),
                "median": 2,
                "difference": pytest.approx(97 / 3),
                "interpretation": (
                    "La media es mayor que la mediana; valores altos "
                    "pueden estar elevando el promedio."
                ),
            },
        ),
    ],
)
def test_statistics_endpoints_return_expected_results(
    api_client,
    mock_persistence,
    path,
    values,
    expected,
):
    client, db = api_client

    response = client.post(path, json={"values": values})

    assert response.status_code == 200
    result = response.json()
    assert result.keys() == expected.keys()
    for key, value in expected.items():
        if isinstance(value, (int, float)):
            assert result[key] == pytest.approx(value)
        else:
            assert result[key] == value
    assert db.committed is True


def test_bayes_endpoint_returns_calculation_and_commits(api_client, mock_persistence):
    client, db = api_client
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
    assert "La probabilidad de compra dado promoción" in response.json()["interpretation"]
    assert db.committed is True


def test_random_variable_endpoint_returns_distribution_statistics(
    api_client,
    mock_persistence,
):
    client, db = api_client
    response = client.post(
        "/api/v1/random-variables/analyze",
        json={
            "name": "ventas",
            "values": [0, 1, 2],
            "probabilities": [0.25, 0.5, 0.25],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["expected_value"] == pytest.approx(1)
    assert body["variance"] == pytest.approx(0.5)
    assert body["standard_deviation"] == pytest.approx(0.5**0.5)
    assert body["observations"] == 3
    assert db.committed is True


@pytest.mark.parametrize(
    ("path", "payload"),
    [
        ("/api/v1/statistics/mean", {"values": []}),
        (
            "/api/v1/probability/bayes",
            {
                "event_a": "A",
                "event_b": "B",
                "probability_a": 0.8,
                "probability_b_given_a": 0.9,
                "probability_b": 0.2,
            },
        ),
        (
            "/api/v1/random-variables/analyze",
            {"name": "ventas", "values": [1, 2], "probabilities": [1]},
        ),
    ],
)
def test_statistical_endpoints_reject_invalid_payloads(api_client, path, payload):
    client, _ = api_client

    response = client.post(path, json=payload)

    assert response.status_code == 422


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/commercial/status",
        "/api/v1/analytics/status",
        "/api/v1/dashboard/status",
        "/api/v1/inventory/status",
        "/api/v1/reports/status",
        "/api/v1/audit/status",
    ],
)
def test_protected_module_status_endpoints_reject_missing_authentication(
    api_client,
    path,
):
    client, _ = api_client
    app.dependency_overrides.pop(get_current_user)

    response = client.get(path)

    assert response.status_code == 401


def test_statistics_endpoint_rejects_role_without_access(api_client):
    client, _ = api_client
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "test-user",
        "company_id": "test-company",
        "role": "Vendedor",
    }

    response = client.post("/api/v1/statistics/mean", json={"values": [1, 2, 3]})

    assert response.status_code == 403
