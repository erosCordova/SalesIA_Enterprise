from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.api.routes import (
    branches,
    categories,
    company,
    customers,
    dashboard,
    insights,
    inventory,
    products,
    reports,
    sales,
)
from app.core.database import get_db
from app.main import app


ID = "00000000-0000-0000-0000-000000000001"
NOW = datetime(2026, 10, 5, tzinfo=timezone.utc).isoformat()

CATEGORY = {"id": ID, "name": "Bebidas", "description": None, "status": "active"}
PRODUCT = {
    "id": ID,
    "category_id": None,
    "category_name": None,
    "sku": "SKU-001",
    "name": "Café",
    "description": None,
    "unit": "unidad",
    "sale_price": "10.00",
    "cost_price": "5.00",
    "stock_quantity": "4.00",
    "minimum_stock": "1.00",
    "maximum_stock": None,
    "status": "active",
}
CUSTOMER = {
    "id": ID,
    "document_type": "DNI",
    "document_number": "12345678",
    "first_name": "Ana",
    "last_name": "Pérez",
    "business_name": None,
    "email": None,
    "phone": None,
    "address": None,
    "city": None,
    "status": "active",
}
BRANCH = {
    "id": ID,
    "company_id": ID,
    "code": "LIM-01",
    "name": "Central",
    "address": None,
    "city": None,
    "country": "Perú",
    "phone": None,
    "email": None,
    "status": "active",
    "created_at": NOW,
    "updated_at": NOW,
}
COMPANY = {
    "id": ID,
    "name": "SalesIA",
    "business_name": None,
    "tax_id": None,
    "email": None,
    "phone": None,
    "address": None,
    "city": None,
    "country": "Perú",
    "status": "active",
    "created_at": NOW,
    "updated_at": NOW,
}
SALE = {
    "id": ID,
    "sale_number": "V-0001",
    "customer_id": None,
    "subtotal": "10.00",
    "discount": "0.00",
    "tax": "0.00",
    "total": "10.00",
    "status": "completed",
    "payment_method": "cash",
    "items": [],
}
REPORT = {
    "id": ID,
    "name": "Reporte de ventas",
    "report_type": "sales",
    "parameters": {},
    "file_url": None,
    "status": "completed",
    "created_at": NOW,
}


@pytest.fixture
def business_client(monkeypatch):
    previous_overrides = app.dependency_overrides.copy()
    user = {
        "id": "test-user",
        "company_id": ID,
        "role": "Administrador",
        "permissions": {"*": True},
    }
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: object()

    monkeypatch.setattr(categories, "get_categories", lambda *args: [])
    monkeypatch.setattr(categories, "create_category", lambda *args: CATEGORY)
    monkeypatch.setattr(categories, "get_category", lambda *args: CATEGORY)
    monkeypatch.setattr(categories, "update_category", lambda *args: CATEGORY)
    monkeypatch.setattr(categories, "delete_category", lambda *args: {"status": "inactive"})

    monkeypatch.setattr(products, "get_products", lambda *args: [])
    monkeypatch.setattr(products, "create_product", lambda *args: PRODUCT)
    monkeypatch.setattr(products, "get_product", lambda *args: PRODUCT)
    monkeypatch.setattr(products, "update_product", lambda *args: PRODUCT)
    monkeypatch.setattr(products, "delete_product", lambda *args: {"status": "inactive"})

    monkeypatch.setattr(customers, "get_customers", lambda *args: [])
    monkeypatch.setattr(customers, "create_customer", lambda *args: CUSTOMER)
    monkeypatch.setattr(customers, "get_customer", lambda *args: CUSTOMER)
    monkeypatch.setattr(customers, "get_customer_history", lambda *args: [])
    monkeypatch.setattr(customers, "update_customer", lambda *args: CUSTOMER)
    monkeypatch.setattr(customers, "delete_customer", lambda *args: {"status": "inactive"})

    monkeypatch.setattr(branches, "get_branches", lambda *args: [])
    monkeypatch.setattr(branches, "create_branch", lambda *args: BRANCH)
    monkeypatch.setattr(branches, "update_branch", lambda *args: BRANCH)
    monkeypatch.setattr(company, "get_current_company", lambda *args: COMPANY)
    monkeypatch.setattr(company, "update_current_company", lambda *args: COMPANY)

    monkeypatch.setattr(sales, "get_sales", lambda *args: [])
    monkeypatch.setattr(sales, "create_sale", lambda *args: SALE)
    monkeypatch.setattr(inventory, "get_inventory", lambda *args: [])
    monkeypatch.setattr(dashboard, "dashboard_summary", lambda *args: {
        "sales_count": 0,
        "revenue": "0",
        "average_ticket": "0",
        "active_customers": 0,
        "products_count": 0,
        "low_stock_count": 0,
        "scope": "company",
    })
    monkeypatch.setattr(insights, "get_insights", lambda *args: [])
    monkeypatch.setattr(insights, "generate_insights", lambda *args: [])
    monkeypatch.setattr(reports, "get_reports", lambda *args: [])
    monkeypatch.setattr(reports, "generate_report", lambda *args: REPORT)

    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.mark.parametrize(
    ("path", "payload", "expected_status", "expected_key"),
    [
        ("/api/v1/categories", {"name": "Bebidas"}, 201, "name"),
        ("/api/v1/products", {"sku": "SKU-001", "name": "Café", "sale_price": "10.00"}, 201, "sku"),
        ("/api/v1/customers", {"document_number": "12345678", "first_name": "Ana", "last_name": "Pérez"}, 201, "document_number"),
        ("/api/v1/branches", {"code": "LIM-01", "name": "Central"}, 201, "code"),
        ("/api/v1/sales", {"items": [{"product_id": ID, "quantity": 1}], "payment_method": "cash"}, 201, "sale_number"),
        ("/api/v1/reports/generate", {"report_type": "sales"}, 201, "report_type"),
    ],
)
def test_business_create_endpoints_validate_and_return_created_resource(
    business_client,
    path,
    payload,
    expected_status,
    expected_key,
):
    response = business_client.post(path, json=payload)

    assert response.status_code == expected_status
    assert expected_key in response.json()


@pytest.mark.parametrize(
    ("method", "path", "payload", "expected_status"),
    [
        ("GET", "/api/v1/categories", None, 200),
        ("GET", f"/api/v1/categories/{ID}", None, 200),
        ("PUT", f"/api/v1/categories/{ID}", {"name": "Bebidas"}, 200),
        ("DELETE", f"/api/v1/categories/{ID}", None, 200),
        ("GET", "/api/v1/products", None, 200),
        ("GET", f"/api/v1/products/{ID}", None, 200),
        ("PUT", f"/api/v1/products/{ID}", {"sku": "SKU-001", "name": "Café", "sale_price": 10}, 200),
        ("DELETE", f"/api/v1/products/{ID}", None, 200),
        ("GET", "/api/v1/customers", None, 200),
        ("GET", f"/api/v1/customers/{ID}", None, 200),
        ("GET", f"/api/v1/customers/{ID}/history", None, 200),
        ("PUT", f"/api/v1/customers/{ID}", {"document_number": "12345678", "first_name": "Ana"}, 200),
        ("DELETE", f"/api/v1/customers/{ID}", None, 200),
        ("GET", "/api/v1/branches", None, 200),
        ("PATCH", f"/api/v1/branches/{ID}", {"name": "Central"}, 200),
        ("GET", "/api/v1/company", None, 200),
        ("PATCH", "/api/v1/company", {"name": "SalesIA"}, 200),
        ("GET", "/api/v1/sales", None, 200),
        ("GET", "/api/v1/inventory", None, 200),
        ("GET", "/api/v1/dashboard/summary", None, 200),
        ("GET", "/api/v1/insights", None, 200),
        ("POST", "/api/v1/insights/generate", None, 200),
        ("GET", "/api/v1/reports", None, 200),
    ],
)
def test_business_endpoints_return_successful_responses(
    business_client,
    method,
    path,
    payload,
    expected_status,
):
    response = business_client.request(method, path, json=payload)

    assert response.status_code == expected_status
