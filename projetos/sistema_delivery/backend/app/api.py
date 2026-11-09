from decimal import Decimal, ROUND_HALF_UP
import secrets
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .database import get_db
from .dependencies import get_current_user, require_permission, tenant_scope
from .models import ApiKey, AuditLog, DeliveryOrder, OrderStatus, Permission, PermissionGroup, Store, Tenant, User, utcnow
from .schemas import (
    ApiKeyCreated, ApiKeyCreate, ApiKeyRead, AuditRead, GroupCreate, GroupRead, GroupUpdate,
    OrderCreate, OrderRead, OrderUpdate, PermissionRead, PublicOrderRead, RegisterRequest,
    StoreCreate, StoreRead, StoreUpdate, TenantRead, TokenResponse, UserCreate, UserRead, UserUpdate,
)
from .security import create_access_token, create_api_key, hash_api_key, hash_password, verify_password

router = APIRouter(prefix="/api/v1")

PERMISSION_CATALOG = {
    "stores.read": "Visualizar lojas e unidades",
    "stores.manage": "Criar, editar e desativar lojas",
    "orders.read": "Visualizar pedidos da loja",
    "orders.create": "Criar pedidos e receber pedidos de canais integrados",
    "orders.update": "Atualizar status, observações e entregador",
    "orders.assign": "Atribuir pedidos a entregadores",
    "users.read": "Visualizar usuários da loja",
    "users.manage": "Convidar, editar, desativar e excluir acesso de usuários",
    "groups.read": "Visualizar grupos e permissões",
    "groups.manage": "Criar, editar e remover grupos e permissões",
    "permissions.read": "Consultar o catálogo de permissões",
    "audit.read": "Consultar a trilha de auditoria",
    "integrations.read": "Visualizar integrações e credenciais",
    "integrations.manage": "Criar e revogar credenciais de API",
    "tenants.manage": "Administrar tenants na plataforma",
}
ALL_STORE_PERMISSIONS = [code for code in PERMISSION_CATALOG if code != "tenants.manage"]
DEFAULT_GROUPS = {
    "Administradores": (ALL_STORE_PERMISSIONS, "Controle completo desta loja."),
    "Gerentes": (["stores.read", "orders.read", "orders.create", "orders.update", "orders.assign", "users.read", "audit.read", "integrations.read", "groups.read", "permissions.read"], "Gestão da operação e da equipe."),
    "Atendentes": (["stores.read", "orders.read", "orders.create", "orders.update"], "Recebimento e atualização de pedidos."),
    "Entregadores": (["orders.read", "orders.update"], "Acompanhamento e atualização de entregas atribuídas."),
}
ORDER_FLOW = list(OrderStatus)


def serialize_user(user: User) -> UserRead:
    return UserRead(
        id=user.id, email=user.email, full_name=user.full_name, tenant_id=user.tenant_id,
        store_id=user.store_id, is_active=user.is_active, is_superuser=user.is_superuser,
        groups=[group.name for group in user.groups], created_at=user.created_at,
    )


def serialize_group(group: PermissionGroup) -> GroupRead:
    return GroupRead(
        id=group.id, name=group.name, description=group.description, is_system=group.is_system,
        member_count=len(group.users), permission_codes=sorted(permission.code for permission in group.permissions),
    )


def write_audit(
    db: Session, request: Request, user: User | None, tenant_id: int | None,
    action: str, entity_type: str, entity_id: int | str | None,
    before: dict | None = None, after: dict | None = None, store_id: int | None = None,
) -> None:
    db.add(AuditLog(
        tenant_id=tenant_id, store_id=store_id, actor_user_id=user.id if user else None,
        action=action, entity_type=entity_type, entity_id=str(entity_id) if entity_id is not None else None,
        before_data=before, after_data=after,
        ip_address=request.client.host if request.client else None,
    ))


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug[:80].strip("-") or f"loja-{secrets.token_hex(4)}"


def ensure_store_access(db: Session, user: User, tenant_id: int, store_id: int, request: Request) -> Store:
    store = db.scalar(select(Store).where(Store.id == store_id, Store.tenant_id == tenant_id, Store.is_active.is_(True)))
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    api_store_id = getattr(request.state, "api_store_id", None)
    if api_store_id is not None and api_store_id != store.id:
        raise HTTPException(status_code=403, detail="Credencial vinculada a outra loja")
    if not user.is_superuser and user.store_id is not None and user.store_id != store.id:
        raise HTTPException(status_code=403, detail="Usuário sem acesso a esta loja")
    return store


def make_store_groups(db: Session, tenant_id: int) -> PermissionGroup:
    permissions = {}
    for code, description in PERMISSION_CATALOG.items():
        permission = db.scalar(select(Permission).where(Permission.code == code))
        if not permission:
            permission = Permission(code=code, description=description)
            db.add(permission)
            db.flush()
        permissions[code] = permission
    owner_group = None
    for name, (codes, description) in DEFAULT_GROUPS.items():
        group = PermissionGroup(
            tenant_id=tenant_id, name=name, description=description, is_system=True,
            permissions=[permissions[code] for code in codes],
        )
        db.add(group)
        if name == "Administradores":
            owner_group = group
    db.flush()
    return owner_group


@router.get("/health")
def health():
    return {"status": "ok", "service": "olivelas-delivery-api", "version": "1"}


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma conta")
    tenant_slug = payload.store_slug
    if db.scalar(select(Tenant.id).where(Tenant.slug == tenant_slug)):
        raise HTTPException(status_code=409, detail="Endereço da loja já está em uso")
    tenant = Tenant(name=payload.store_name, slug=tenant_slug)
    db.add(tenant)
    db.flush()
    store = Store(tenant_id=tenant.id, name=payload.store_name, slug=tenant_slug)
    db.add(store)
    db.flush()
    owner_group = make_store_groups(db, tenant.id)
    user = User(
        tenant_id=tenant.id, store_id=store.id, email=email, full_name=payload.full_name,
        password_hash=hash_password(payload.password), groups=[owner_group],
    )
    db.add(user)
    db.flush()
    write_audit(db, request, user, tenant.id, "tenant.registered", "tenant", tenant.id, after={"name": tenant.name, "slug": tenant.slug})
    write_audit(db, request, user, tenant.id, "store.created", "store", store.id, after={"name": store.name}, store_id=store.id)
    write_audit(db, request, user, tenant.id, "user.registered", "user", user.id, after={"email": user.email}, store_id=store.id)
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, tenant.id),
        expires_in=settings.jwt_access_token_minutes * 60,
        user=serialize_user(user),
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form.username.lower()
    user = db.scalar(select(User).options(selectinload(User.groups).selectinload(PermissionGroup.permissions)).where(User.email == email))
    if not user or not verify_password(form.password, user.password_hash) or not user.is_active:
        write_audit(db, request, user, user.tenant_id if user else None, "auth.login_failed", "user", user.id if user else None, store_id=user.store_id if user else None)
        db.commit()
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos", headers={"WWW-Authenticate": "Bearer"})
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=403, detail="Tenant inativo")
    write_audit(db, request, user, user.tenant_id, "auth.login", "user", user.id, store_id=user.store_id)
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, user.tenant_id),
        expires_in=settings.jwt_access_token_minutes * 60,
        user=serialize_user(user),
    )


@router.post("/auth/logout")
def logout(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    write_audit(db, request, user, user.tenant_id, "auth.logout", "user", user.id, store_id=user.store_id)
    db.commit()
    return {"message": "Sessão encerrada. Descarte o token de acesso."}


@router.get("/auth/me", response_model=UserRead)
def current_account(user: User = Depends(get_current_user)):
    return serialize_user(user)


@router.get("/permissions", response_model=list[PermissionRead])
def list_permissions(
    _user: User = Depends(require_permission("permissions.read")),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Permission).order_by(Permission.code)).all()


@router.get("/stores", response_model=list[StoreRead])
def list_stores(request: Request, user: User = Depends(require_permission("stores.read")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    statement = select(Store).where(Store.tenant_id == tenant_id).order_by(Store.name)
    api_store_id = getattr(request.state, "api_store_id", None)
    if api_store_id is not None:
        statement = statement.where(Store.id == api_store_id)
    if not user.is_superuser and user.store_id:
        statement = statement.where(Store.id == user.store_id)
    return db.scalars(statement).all()


@router.post("/stores", response_model=StoreRead, status_code=status.HTTP_201_CREATED)
def create_store(payload: StoreCreate, request: Request, user: User = Depends(require_permission("stores.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    slug = slugify(payload.slug)
    if db.scalar(select(Store.id).where(Store.slug == slug)):
        raise HTTPException(status_code=409, detail="Endereço da loja já está em uso")
    store = Store(tenant_id=tenant_id, name=payload.name, slug=slug, phone=payload.phone, address=payload.address)
    db.add(store)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Endereço da loja já está em uso") from exc
    write_audit(db, request, user, tenant_id, "store.created", "store", store.id, after={"name": store.name, "slug": store.slug}, store_id=store.id)
    db.commit()
    db.refresh(store)
    return store


@router.patch("/stores/{store_id}", response_model=StoreRead)
def update_store(store_id: int, payload: StoreUpdate, request: Request, user: User = Depends(require_permission("stores.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    store = db.scalar(select(Store).where(Store.id == store_id, Store.tenant_id == tenant_id))
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    before = {"name": store.name, "phone": store.phone, "address": store.address, "is_active": store.is_active}
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(store, key, value)
    write_audit(db, request, user, tenant_id, "store.updated", "store", store.id, before, {"name": store.name, "phone": store.phone, "address": store.address, "is_active": store.is_active}, store_id=store.id)
    db.commit()
    db.refresh(store)
    return store


@router.delete("/stores/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_store(store_id: int, request: Request, user: User = Depends(require_permission("stores.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    store = db.scalar(select(Store).where(Store.id == store_id, Store.tenant_id == tenant_id))
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    store.is_active = False
    write_audit(db, request, user, tenant_id, "store.deactivated", "store", store.id, store_id=store.id)
    db.commit()


@router.get("/users", response_model=list[UserRead])
def list_users(request: Request, user: User = Depends(require_permission("users.read")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    users = db.scalars(select(User).options(selectinload(User.groups)).where(User.tenant_id == tenant_id).order_by(User.full_name)).all()
    api_store_id = getattr(request.state, "api_store_id", None)
    if api_store_id is not None:
        users = [person for person in users if person.store_id == api_store_id]
    if not user.is_superuser and user.store_id:
        users = [person for person in users if person.store_id in (None, user.store_id)]
    return [serialize_user(person) for person in users]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, request: Request, user: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma conta")
    store_id = payload.store_id or user.store_id
    if store_id:
        ensure_store_access(db, user, tenant_id, store_id, request)
    groups = db.scalars(select(PermissionGroup).where(PermissionGroup.id.in_(payload.group_ids), PermissionGroup.tenant_id == tenant_id)).all() if payload.group_ids else []
    if len(groups) != len(set(payload.group_ids)):
        raise HTTPException(status_code=400, detail="Um ou mais grupos não pertencem a esta loja")
    member = User(tenant_id=tenant_id, store_id=store_id, email=email, full_name=payload.full_name, password_hash=hash_password(payload.password), groups=groups)
    db.add(member)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma conta") from exc
    write_audit(db, request, user, tenant_id, "user.created", "user", member.id, after={"email": member.email, "groups": [group.name for group in groups]}, store_id=member.store_id)
    db.commit()
    db.refresh(member)
    return serialize_user(member)


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, request: Request, user: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    member = db.scalar(select(User).options(selectinload(User.groups)).where(User.id == user_id, User.tenant_id == tenant_id))
    if not member:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if member.is_superuser and not user.is_superuser:
        raise HTTPException(status_code=403, detail="A conta de superusuário não pode ser alterada")
    before = {"full_name": member.full_name, "store_id": member.store_id, "is_active": member.is_active, "groups": [group.name for group in member.groups]}
    changes = payload.model_dump(exclude_unset=True)
    group_ids = changes.pop("group_ids", None)
    if "store_id" in changes and changes["store_id"] is not None:
        ensure_store_access(db, user, tenant_id, changes["store_id"], request)
    for key, value in changes.items():
        setattr(member, key, value)
    if group_ids is not None:
        groups = db.scalars(select(PermissionGroup).where(PermissionGroup.id.in_(group_ids), PermissionGroup.tenant_id == tenant_id)).all() if group_ids else []
        if len(groups) != len(set(group_ids)):
            raise HTTPException(status_code=400, detail="Um ou mais grupos não pertencem a esta loja")
        member.groups = groups
    write_audit(db, request, user, tenant_id, "user.updated", "user", member.id, before, {"full_name": member.full_name, "store_id": member.store_id, "is_active": member.is_active, "groups": [group.name for group in member.groups]}, store_id=member.store_id)
    db.commit()
    db.refresh(member)
    return serialize_user(member)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(user_id: int, request: Request, user: User = Depends(require_permission("users.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    member = db.scalar(select(User).where(User.id == user_id, User.tenant_id == tenant_id))
    if not member:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if member.id == user.id or member.is_superuser:
        raise HTTPException(status_code=400, detail="Não é possível desativar esta conta")
    member.is_active = False
    write_audit(db, request, user, tenant_id, "user.deactivated", "user", member.id, before={"is_active": True}, after={"is_active": False}, store_id=member.store_id)
    db.commit()


@router.get("/groups", response_model=list[GroupRead])
def list_groups(request: Request, user: User = Depends(require_permission("groups.read")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    groups = db.scalars(select(PermissionGroup).options(selectinload(PermissionGroup.users), selectinload(PermissionGroup.permissions)).where(PermissionGroup.tenant_id == tenant_id).order_by(PermissionGroup.name)).all()
    return [serialize_group(group) for group in groups]


def resolve_permissions(db: Session, codes: list[str], allow_platform: bool = False) -> list[Permission]:
    if not allow_platform and "tenants.manage" in codes:
        raise HTTPException(status_code=403, detail="A permissão tenants.manage é exclusiva de superusuários")
    permissions = db.scalars(select(Permission).where(Permission.code.in_(codes))).all() if codes else []
    found = {permission.code for permission in permissions}
    if found != set(codes):
        raise HTTPException(status_code=400, detail={"message": "Permissões desconhecidas", "unknown": sorted(set(codes) - found)})
    return permissions


@router.post("/groups", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, request: Request, user: User = Depends(require_permission("groups.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    group = PermissionGroup(tenant_id=tenant_id, name=payload.name, description=payload.description, permissions=resolve_permissions(db, payload.permission_codes, user.is_superuser))
    db.add(group)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um grupo com esse nome") from exc
    write_audit(db, request, user, tenant_id, "group.created", "permission_group", group.id, after={"name": group.name, "permissions": payload.permission_codes})
    db.commit()
    db.refresh(group)
    return serialize_group(group)


@router.patch("/groups/{group_id}", response_model=GroupRead)
def update_group(group_id: int, payload: GroupUpdate, request: Request, user: User = Depends(require_permission("groups.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    group = db.scalar(select(PermissionGroup).options(selectinload(PermissionGroup.users), selectinload(PermissionGroup.permissions)).where(PermissionGroup.id == group_id, PermissionGroup.tenant_id == tenant_id))
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    changes = payload.model_dump(exclude_unset=True)
    permission_codes = changes.pop("permission_codes", None)
    before = {"name": group.name, "description": group.description, "permissions": [permission.code for permission in group.permissions]}
    if group.is_system and "name" in changes:
        raise HTTPException(status_code=400, detail="O nome de grupos do sistema não pode ser alterado")
    for key, value in changes.items():
        setattr(group, key, value)
    if permission_codes is not None:
        group.permissions = resolve_permissions(db, permission_codes, user.is_superuser)
    write_audit(db, request, user, tenant_id, "group.updated", "permission_group", group.id, before, {"name": group.name, "description": group.description, "permissions": [permission.code for permission in group.permissions]})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um grupo com esse nome") from exc
    db.refresh(group)
    return serialize_group(group)


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, request: Request, user: User = Depends(require_permission("groups.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    group = db.scalar(select(PermissionGroup).where(PermissionGroup.id == group_id, PermissionGroup.tenant_id == tenant_id))
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    if group.is_system:
        raise HTTPException(status_code=400, detail="Grupos padrão não podem ser excluídos")
    group_name = group.name
    db.delete(group)
    write_audit(db, request, user, tenant_id, "group.deleted", "permission_group", group_id, before={"name": group_name})
    db.commit()


def create_order_record(payload: OrderCreate, request: Request, db: Session, user: User, source_override: str | None = None) -> DeliveryOrder:
    tenant_id = tenant_scope(user, request)
    store = ensure_store_access(db, user, tenant_id, payload.store_id, request)
    calculated = sum((item.quantity * item.unit_price for item in payload.items), Decimal("0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if calculated != payload.total_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP):
        raise HTTPException(status_code=422, detail="total_amount deve corresponder à soma dos itens")
    if payload.external_id:
        existing = db.scalar(select(DeliveryOrder).where(DeliveryOrder.tenant_id == tenant_id, DeliveryOrder.external_id == payload.external_id))
        if existing:
            raise HTTPException(status_code=409, detail={"message": "Pedido externo já recebido", "order_id": existing.id})
    order = DeliveryOrder(
        tenant_id=tenant_id, store_id=store.id, external_id=payload.external_id,
        customer_name=payload.customer_name, customer_phone=payload.customer_phone,
        delivery_address=payload.delivery_address, items=[item.model_dump(mode="json") for item in payload.items],
        total_amount=payload.total_amount, source=source_override or payload.source,
        notes=payload.notes, status=OrderStatus.pedido_feito,
    )
    db.add(order)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        if payload.external_id:
            existing = db.scalar(select(DeliveryOrder).where(DeliveryOrder.tenant_id == tenant_id, DeliveryOrder.external_id == payload.external_id))
            if existing:
                raise HTTPException(status_code=409, detail={"message": "Pedido externo já recebido", "order_id": existing.id}) from exc
        raise HTTPException(status_code=409, detail="Pedido não pôde ser criado por conflito de identificador") from exc
    write_audit(db, request, user, tenant_id, "order.created", "delivery_order", order.id, after={"status": order.status.value, "source": order.source, "total_amount": str(order.total_amount)}, store_id=order.store_id)
    return order


@router.get("/orders", response_model=list[OrderRead])
def list_orders(
    request: Request, store_id: int | None = None, order_status: OrderStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200), offset: int = Query(default=0, ge=0),
    user: User = Depends(require_permission("orders.read")), db: Session = Depends(get_db),
):
    tenant_id = tenant_scope(user, request)
    statement = select(DeliveryOrder).where(DeliveryOrder.tenant_id == tenant_id).order_by(DeliveryOrder.created_at.desc()).limit(limit).offset(offset)
    api_store_id = getattr(request.state, "api_store_id", None)
    if api_store_id is not None:
        statement = statement.where(DeliveryOrder.store_id == api_store_id)
    if store_id:
        ensure_store_access(db, user, tenant_id, store_id, request)
        statement = statement.where(DeliveryOrder.store_id == store_id)
    elif not user.is_superuser and user.store_id:
        statement = statement.where(DeliveryOrder.store_id == user.store_id)
    if not user.is_superuser and any(group.name == "Entregadores" for group in user.groups) and not any("orders.assign" in {permission.code for permission in group.permissions} for group in user.groups):
        statement = statement.where(DeliveryOrder.courier_user_id == user.id)
    if order_status:
        statement = statement.where(DeliveryOrder.status == order_status)
    return db.scalars(statement).all()


@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, request: Request, user: User = Depends(require_permission("orders.create")), db: Session = Depends(get_db)):
    order = create_order_record(payload, request, db, user)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, request: Request, user: User = Depends(require_permission("orders.read")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    order = db.scalar(select(DeliveryOrder).where(DeliveryOrder.id == order_id, DeliveryOrder.tenant_id == tenant_id))
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    ensure_store_access(db, user, tenant_id, order.store_id, request)
    if not user.is_superuser and any(group.name == "Entregadores" for group in user.groups) and not any("orders.assign" in {permission.code for permission in group.permissions} for group in user.groups) and order.courier_user_id != user.id:
        raise HTTPException(status_code=403, detail="Entregadores só podem consultar pedidos atribuídos à própria conta")
    return order


@router.patch("/orders/{order_id}", response_model=OrderRead)
def update_order(order_id: int, payload: OrderUpdate, request: Request, user: User = Depends(require_permission("orders.update")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    order = db.scalar(select(DeliveryOrder).where(DeliveryOrder.id == order_id, DeliveryOrder.tenant_id == tenant_id))
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    ensure_store_access(db, user, tenant_id, order.store_id, request)
    if not user.is_superuser and any(group.name == "Entregadores" for group in user.groups) and not any("orders.assign" in {permission.code for permission in group.permissions} for group in user.groups) and order.courier_user_id != user.id:
        raise HTTPException(status_code=403, detail="Entregadores só podem atualizar pedidos atribuídos à própria conta")
    before = {"status": order.status.value, "courier_user_id": order.courier_user_id, "notes": order.notes}
    changes = payload.model_dump(exclude_unset=True)
    if "status" in changes and changes["status"] != order.status:
        if order.status == OrderStatus.entregue:
            raise HTTPException(status_code=409, detail="Um pedido entregue não pode voltar ao fluxo")
        expected = ORDER_FLOW[min(ORDER_FLOW.index(order.status) + 1, len(ORDER_FLOW) - 1)]
        if changes["status"] != expected:
            raise HTTPException(status_code=409, detail=f"Transição inválida. Próximo status permitido: {expected.value}")
    if "courier_user_id" in changes and changes["courier_user_id"] is not None:
        courier = db.scalar(select(User).where(User.id == changes["courier_user_id"], User.tenant_id == tenant_id, User.is_active.is_(True)))
        if not courier:
            raise HTTPException(status_code=404, detail="Entregador não encontrado")
        if not user.is_superuser and "orders.assign" not in {permission.code for group in user.groups for permission in group.permissions}:
            raise HTTPException(status_code=403, detail="Permissão necessária: orders.assign")
    for key, value in changes.items():
        setattr(order, key, value)
    write_audit(db, request, user, tenant_id, "order.updated", "delivery_order", order.id, before, {"status": order.status.value, "courier_user_id": order.courier_user_id, "notes": order.notes}, store_id=order.store_id)
    db.commit()
    db.refresh(order)
    return order


@router.post("/integrations/whatsapp/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def receive_whatsapp_order(payload: OrderCreate, request: Request, user: User = Depends(require_permission("orders.create")), db: Session = Depends(get_db)):
    order = create_order_record(payload, request, db, user, "WhatsApp")
    write_audit(db, request, user, order.tenant_id, "integration.whatsapp_order.received", "delivery_order", order.id, after={"external_id": order.external_id}, store_id=order.store_id)
    db.commit()
    db.refresh(order)
    return order


@router.get("/public/tracking/{tracking_code}", response_model=PublicOrderRead)
def public_tracking(tracking_code: str, db: Session = Depends(get_db)):
    order = db.scalar(select(DeliveryOrder).where(DeliveryOrder.tracking_code == tracking_code))
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    store = db.get(Store, order.store_id)
    tenant = db.get(Tenant, order.tenant_id)
    if not store or not store.is_active or not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return PublicOrderRead(
        tracking_code=order.tracking_code, store_name=store.name,
        customer_name=order.customer_name, delivery_address=order.delivery_address,
        status=order.status, created_at=order.created_at, updated_at=order.updated_at,
    )


@router.get("/audit", response_model=list[AuditRead])
def list_audit(
    request: Request, limit: int = Query(default=100, ge=1, le=500), offset: int = Query(default=0, ge=0),
    user: User = Depends(require_permission("audit.read")), db: Session = Depends(get_db),
):
    tenant_id = tenant_scope(user, request)
    statement = select(AuditLog).where(AuditLog.tenant_id == tenant_id).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    api_store_id = getattr(request.state, "api_store_id", None) or (user.store_id if not user.is_superuser else None)
    if api_store_id is not None:
        statement = statement.where(AuditLog.store_id == api_store_id)
    return db.scalars(statement).all()


@router.get("/api-keys", response_model=list[ApiKeyRead])
def list_api_keys(request: Request, user: User = Depends(require_permission("integrations.read")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    statement = select(ApiKey).where(ApiKey.tenant_id == tenant_id).order_by(ApiKey.created_at.desc())
    api_store_id = getattr(request.state, "api_store_id", None) or (user.store_id if not user.is_superuser else None)
    if api_store_id is not None:
        statement = statement.where(ApiKey.store_id == api_store_id)
    return db.scalars(statement).all()


@router.post("/api-keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
def create_api_credential(payload: ApiKeyCreate, request: Request, user: User = Depends(require_permission("integrations.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    store = ensure_store_access(db, user, tenant_id, payload.store_id, request)
    granted = {permission.code for group in user.groups for permission in group.permissions}
    if not user.is_superuser and not set(payload.scopes).issubset(granted):
        raise HTTPException(status_code=403, detail="Não é possível delegar escopos que sua conta não possui")
    if not user.is_superuser and "tenants.manage" in payload.scopes:
        raise HTTPException(status_code=403, detail="A permissão tenants.manage é exclusiva de superusuários")
    unknown = set(payload.scopes) - set(PERMISSION_CATALOG)
    if unknown:
        raise HTTPException(status_code=400, detail={"message": "Escopos desconhecidos", "unknown": sorted(unknown)})
    raw_secret = create_api_key()
    credential = ApiKey(
        tenant_id=tenant_id, store_id=store.id, created_by_user_id=user.id, name=payload.name,
        prefix=raw_secret[:12], secret_hash=hash_api_key(raw_secret), scopes=sorted(set(payload.scopes)),
    )
    db.add(credential)
    db.flush()
    write_audit(db, request, user, tenant_id, "api_key.created", "api_key", credential.id, after={"name": credential.name, "store_id": store.id, "scopes": credential.scopes}, store_id=store.id)
    db.commit()
    db.refresh(credential)
    return ApiKeyCreated(
        id=credential.id, name=credential.name, prefix=credential.prefix,
        scopes=credential.scopes, is_active=credential.is_active,
        created_at=credential.created_at, secret=raw_secret,
    )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_credential(key_id: int, request: Request, user: User = Depends(require_permission("integrations.manage")), db: Session = Depends(get_db)):
    tenant_id = tenant_scope(user, request)
    credential = db.scalar(select(ApiKey).where(ApiKey.id == key_id, ApiKey.tenant_id == tenant_id))
    if not credential:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    credential.is_active = False
    write_audit(db, request, user, tenant_id, "api_key.revoked", "api_key", credential.id, before={"is_active": True}, after={"is_active": False}, store_id=credential.store_id)
    db.commit()


@router.get("/admin/tenants", response_model=list[TenantRead])
def list_tenants(_request: Request, user: User = Depends(require_permission("tenants.manage")), db: Session = Depends(get_db)):
    return db.scalars(select(Tenant).order_by(Tenant.name)).all()
