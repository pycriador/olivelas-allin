import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.dependencies import require_permission
from app.main import app


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.state.initialize_database = False
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        del app.state.initialize_database
        engine.dispose()


def register(client: TestClient, email: str, slug: str):
    response = client.post("/api/v1/auth/register", json={
        "store_name": f"Loja {slug}", "store_slug": slug, "full_name": "Conta Admin",
        "email": email, "password": "senha-segura-123",
    })
    assert response.status_code == 201, response.text
    body = response.json()
    return body["access_token"], body["user"]


def create_order(client: TestClient, token: str, store_id: int, external_id: str, total_amount: int = 31):
    return client.post("/api/v1/orders", headers={"Authorization": f"Bearer {token}"}, json={
        "store_id": store_id, "external_id": external_id, "customer_name": "Cliente Teste",
        "customer_phone": "+5511999990000", "delivery_address": "Rua das Flores, 123",
        "items": [{"name": "Bowl", "quantity": 2, "unit_price": 15.5}],
        "total_amount": total_amount, "source": "teste",
    })


def test_order_flow_is_tenant_scoped_and_publicly_trackable(client: TestClient):
    first_token, first_user = register(client, "delivery-one@example.com", "delivery-one")
    second_token, _ = register(client, "delivery-two@example.com", "delivery-two")
    created = create_order(client, first_token, first_user["store_id"], "e2e-tenant-order")
    assert created.status_code == 201, created.text
    order = created.json()

    own_orders = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {first_token}"})
    other_orders = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {second_token}"})
    assert len(own_orders.json()) == 1
    assert other_orders.json() == []
    tenant_spoof = client.get("/api/v1/orders", headers={
        "Authorization": f"Bearer {second_token}", "X-Tenant-ID": str(first_user["tenant_id"]),
    })
    assert tenant_spoof.json() == []
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {first_token}"}).status_code == 200

    tracked = client.get(f"/api/v1/public/tracking/{order['tracking_code']}")
    assert tracked.status_code == 200
    assert tracked.json()["status"] == "Pedido feito"

    headers = {"Authorization": f"Bearer {first_token}"}
    advanced = client.patch(f"/api/v1/orders/{order['id']}", headers=headers, json={"status": "Preparando"})
    assert advanced.status_code == 200
    skipped = client.patch(f"/api/v1/orders/{order['id']}", headers=headers, json={"status": "Em trajeto"})
    assert skipped.status_code == 409
    assert client.get(f"/api/v1/orders/{order['id']}", headers=headers).status_code == 200


def test_whatsapp_integration_requires_scoped_api_key(client: TestClient):
    token, user = register(client, "delivery-api@example.com", "delivery-api")
    auth = {"Authorization": f"Bearer {token}"}
    created_key = client.post("/api/v1/api-keys", headers=auth, json={
        "name": "Atendimento WhatsApp", "store_id": user["store_id"], "scopes": ["orders.create"],
    })
    assert created_key.status_code == 201, created_key.text
    key = created_key.json()["secret"]
    received = client.post("/api/v1/integrations/whatsapp/orders", headers={"X-API-Key": key}, json={
        "store_id": user["store_id"], "external_id": "whatsapp-e2e-1",
        "customer_name": "Cliente WhatsApp", "customer_phone": "+5511999990001",
        "delivery_address": "Rua A, 10", "items": [{"name": "Suco", "quantity": 1, "unit_price": 12}],
        "total_amount": 12, "source": "webhook",
    })
    assert received.status_code == 201, received.text
    assert received.json()["source"] == "WhatsApp"

    forbidden = client.get("/api/v1/orders", headers={"X-API-Key": key})
    assert forbidden.status_code == 403
    revoked = client.delete(f"/api/v1/api-keys/{created_key.json()['id']}", headers=auth)
    assert revoked.status_code == 204
    rejected = client.post("/api/v1/integrations/whatsapp/orders", headers={"X-API-Key": key}, json={
        "store_id": user["store_id"], "customer_name": "x", "customer_phone": "12345",
        "delivery_address": "Rua B, 11", "items": [{"name": "Água", "quantity": 1, "unit_price": 3}],
        "total_amount": 3,
    })
    assert rejected.status_code == 401


def test_orders_reject_inconsistent_totals_and_duplicate_external_ids(client: TestClient):
    token, user = register(client, "delivery-validation@example.com", "delivery-validation")
    invalid_total = create_order(client, token, user["store_id"], "external-total", total_amount=30)
    assert invalid_total.status_code == 422
    order = client.post("/api/v1/orders", headers={"Authorization": f"Bearer {token}"}, json={
        "store_id": user["store_id"], "external_id": "external-once",
        "customer_name": "Cliente Teste", "customer_phone": "+5511999990000",
        "delivery_address": "Rua das Flores, 123",
        "items": [{"name": "Bowl", "quantity": 2, "unit_price": 15.5}],
        "total_amount": 31,
    })
    assert order.status_code == 201, order.text
    duplicate = client.post("/api/v1/orders", headers={"Authorization": f"Bearer {token}"}, json={
        "store_id": user["store_id"], "external_id": "external-once",
        "customer_name": "Cliente Teste", "customer_phone": "+5511999990000",
        "delivery_address": "Rua das Flores, 123",
        "items": [{"name": "Bowl", "quantity": 2, "unit_price": 15.5}],
        "total_amount": 31,
    })
    assert duplicate.status_code == 409


def test_tenant_admin_cannot_grant_platform_permissions(client: TestClient):
    token, _ = register(client, "delivery-groups@example.com", "delivery-groups")
    response = client.post("/api/v1/groups", headers={"Authorization": f"Bearer {token}"}, json={
        "name": "Global admins", "description": "must not cross tenants",
        "permission_codes": ["tenants.manage"],
    })
    assert response.status_code == 403


def test_courier_can_only_see_and_advance_assigned_orders(client: TestClient):
    owner_token, owner = register(client, "delivery-owner@example.com", "delivery-courier")
    groups = client.get("/api/v1/groups", headers={"Authorization": f"Bearer {owner_token}"}).json()
    courier_group = next(group for group in groups if group["name"] == "Entregadores")
    member = client.post("/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}, json={
        "email": "driver@example.com", "full_name": "Entregador Teste",
        "password": "senha-segura-456", "store_id": owner["store_id"], "group_ids": [courier_group["id"]],
    })
    assert member.status_code == 201, member.text
    order = create_order(client, owner_token, owner["store_id"], "courier-assigned-order").json()
    login = client.post("/api/v1/auth/login", data={"username": "driver@example.com", "password": "senha-segura-456"})
    assert login.status_code == 200, login.text
    courier_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.get("/api/v1/orders", headers=courier_headers).json() == []
    assert client.get(f"/api/v1/orders/{order['id']}", headers=courier_headers).status_code == 403

    assigned = client.patch(f"/api/v1/orders/{order['id']}", headers={"Authorization": f"Bearer {owner_token}"}, json={"courier_user_id": member.json()["id"]})
    assert assigned.status_code == 200
    visible = client.get("/api/v1/orders", headers=courier_headers)
    assert [item["id"] for item in visible.json()] == [order["id"]]
    advanced = client.patch(f"/api/v1/orders/{order['id']}", headers=courier_headers, json={"status": "Preparando"})
    assert advanced.status_code == 200


def test_api_key_scopes_also_apply_to_superuser_accounts():
    from types import SimpleNamespace

    request = SimpleNamespace(state=SimpleNamespace(api_scopes={"orders.create"}))
    superuser = SimpleNamespace(is_superuser=True, groups=[])
    with pytest.raises(HTTPException) as error:
        require_permission("orders.read")(request, superuser)
    assert error.value.status_code == 403
