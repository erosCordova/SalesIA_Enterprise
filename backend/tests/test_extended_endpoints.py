from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.api.routes import analytics, audit, reports, users
from app.core import database
from app.core.database import get_db
from app.main import app


ID = "00000000-0000-0000-0000-000000000001"


class FakeSession:
    def __init__(self):
        self.committed = False

    def commit(self):
        self.committed = True


@pytest.fixture
def admin_client():
    previous_overrides = app.dependency_overrides.copy()
    session = FakeSession()
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "test-user",
        "company_id": ID,
        "role": "Administrador",
        "permissions": {"*": True},
        "status": "active",
        "dni": "87654321",
        "first_name": "Admin",
        "last_name": "Test",
        "email": "admin@example.test",
        "phone": None,
        "company": "SalesIA",
    }
    app.dependency_overrides[get_db] = lambda: session
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("GET", "/api/v1/auth/me", None),
        ("GET", "/api/v1/users/roles", None),
        ("GET", "/api/v1/users", None),
        ("POST", "/api/v1/users", {}),
        ("GET", "/api/v1/audit", None),
        ("GET", f"/api/v1/reports/{ID}/download", None),
        ("GET", "/api/v1/analytics/dashboard", None),
        ("POST", "/api/v1/analytics/sales-analysis", {}),
    ],
)
def test_remaining_protected_endpoints_reject_missing_authentication(
    method,
    path,
    payload,
):
    with TestClient(app) as client:
        response = client.request(method, path, json=payload)

    assert response.status_code == 401


def test_analytics_dashboard_returns_validated_summary(admin_client, monkeypatch):
    client, _ = admin_client
    expected = {
        "start_date": "2026-01-01",
        "end_date": "2026-01-31",
        "summary": {
            "total_sales": 2,
            "total_revenue": "50.00",
            "average_ticket": "25.00",
            "median_ticket": "25.00",
        },
        "daily_sales": [],
    }
    monkeypatch.setattr(analytics, "get_analytics_dashboard", lambda **kwargs: expected)

    response = client.get(
        "/api/v1/analytics/dashboard",
        params={"start_date": "2026-01-01", "end_date": "2026-01-31"},
    )

    assert response.status_code == 200
    assert response.json()["summary"]["total_sales"] == 2
    assert response.json()["summary"]["total_revenue"] == "50.00"


def test_analytics_dashboard_rejects_reversed_date_range(admin_client):
    client, _ = admin_client

    response = client.get(
        "/api/v1/analytics/dashboard",
        params={"start_date": "2026-02-01", "end_date": "2026-01-01"},
    )

    assert response.status_code == 422


def test_sales_analysis_endpoint_returns_comparison_and_persists_test_result(
    admin_client,
    monkeypatch,
):
    client, session = admin_client
    monkeypatch.setattr(analytics, "get_completed_sale_totals", lambda **kwargs: [10, 20, 30])
    monkeypatch.setattr(
        analytics,
        "persist_numeric_analysis",
        lambda *args, **kwargs: SimpleNamespace(id="test-analysis"),
    )
    monkeypatch.setattr(analytics, "create_result", lambda *args, **kwargs: None)

    response = client.post(
        "/api/v1/analytics/sales-analysis",
        json={"start_date": "2026-01-01", "end_date": "2026-01-31"},
    )

    assert response.status_code == 200
    assert response.json()["count"] == 3
    assert response.json()["mean"] == pytest.approx(20)
    assert session.committed is True


class FakeResult:
    def __init__(self, first=None, all_rows=None, one=None):
        self.first_row = first
        self.all_rows = all_rows or []
        self.one_row = one

    def mappings(self):
        return self

    def first(self):
        return self.first_row

    def all(self):
        return self.all_rows

    def one(self):
        return self.one_row


class FakeConnection:
    def __init__(self, results):
        self.results = iter(results)

    def execute(self, *args, **kwargs):
        return next(self.results)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FakeEngine:
    def __init__(self, connect_results=(), begin_results=(), connect_calls=None):
        self.connect_results = connect_results
        self.begin_results = begin_results
        self.connect_calls = list(connect_calls or [])

    def connect(self):
        if self.connect_calls:
            return FakeConnection(self.connect_calls.pop(0))
        return FakeConnection(self.connect_results)

    def begin(self):
        return FakeConnection(self.begin_results)


def test_user_roles_and_list_endpoints_serialize_database_rows(admin_client, monkeypatch):
    client, _ = admin_client
    roles = [{"id": ID, "name": "Administrador", "description": "Acceso total"}]
    user_rows = [
        {
            "id": ID,
            "dni": "87654321",
            "first_name": "Admin",
            "last_name": "Test",
            "phone": None,
            "role": "Administrador",
            "company": "SalesIA",
            "status": "active",
        }
    ]
    monkeypatch.setattr(
        users,
        "engine",
        FakeEngine(
            connect_calls=[
                [FakeResult(all_rows=roles)],
                [FakeResult(all_rows=user_rows)],
            ]
        ),
    )

    roles_response = client.get("/api/v1/users/roles")
    users_response = client.get("/api/v1/users")

    assert roles_response.status_code == 200
    assert roles_response.json()[0]["name"] == "Administrador"
    assert users_response.status_code == 200
    assert users_response.json()[0]["dni"] == "87654321"


def test_user_create_endpoint_uses_mocked_auth_and_database(admin_client, monkeypatch):
    client, _ = admin_client
    created_row = {
        "id": ID,
        "auth_user_id": "auth-test-id",
        "dni": "99000001",
        "first_name": "Prueba",
        "last_name": "Usuario",
        "phone": None,
        "status": "active",
    }
    monkeypatch.setattr(
        users,
        "engine",
        FakeEngine(
            connect_results=[
                FakeResult(first=None),
                FakeResult(first={"id": "role-test", "name": "Vendedor"}),
                FakeResult(first={"id": ID, "name": "SalesIA"}),
            ],
            begin_results=[FakeResult(one=created_row)],
        ),
    )
    mock_auth_user = SimpleNamespace(id="auth-test-id")
    mock_supabase = SimpleNamespace(
        auth=SimpleNamespace(
            admin=SimpleNamespace(
                create_user=lambda payload: SimpleNamespace(user=mock_auth_user),
                delete_user=lambda user_id: None,
            )
        )
    )
    monkeypatch.setattr(users, "create_client", lambda *args, **kwargs: mock_supabase)
    monkeypatch.setattr(users, "record_critical_action", lambda *args, **kwargs: None)

    response = client.post(
        "/api/v1/users",
        json={
            "dni": "99000001",
            "first_name": "Prueba",
            "last_name": "Usuario",
            "password": "Local-Test-Password-123",
            "role": "Vendedor",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "Vendedor"
    assert response.json()["company"] == "SalesIA"


def test_audit_events_endpoint_returns_company_events(admin_client, monkeypatch):
    client, _ = admin_client
    monkeypatch.setattr(audit, "engine", FakeEngine(connect_results=[FakeResult()]))
    monkeypatch.setattr(audit, "list_company_audit_events", lambda *args: [])

    response = client.get("/api/v1/audit", params={"limit": 10})

    assert response.status_code == 200
    assert response.json() == []


def test_report_download_endpoint_returns_file_for_company_report(
    admin_client,
    monkeypatch,
    tmp_path,
):
    client, _ = admin_client
    file_path = tmp_path / f"{ID}.csv"
    file_path.write_text("name,total\nProducto,10\n", encoding="utf-8")
    monkeypatch.setattr(
        database,
        "engine",
        FakeEngine(
            connect_results=[FakeResult(first={"id": ID, "file_url": "mock://report.csv"})],
            begin_results=[FakeResult()],
        ),
    )
    import app.utils.report_files as report_files
    import app.services.audit as audit_service

    monkeypatch.setattr(report_files, "REPORTS_DIR", tmp_path)
    monkeypatch.setattr(audit_service, "record_critical_action", lambda *args, **kwargs: None)

    response = client.get(f"/api/v1/reports/{ID}/download")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "salesia-report-" in response.headers["content-disposition"]
