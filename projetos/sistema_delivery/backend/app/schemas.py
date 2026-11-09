from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints
from typing_extensions import Annotated

from .models import OrderStatus

Slug = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserRead"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=10, max_length=128)
    store_id: int | None = None
    group_ids: list[int] = Field(default_factory=list)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    tenant_id: int
    store_id: int | None
    is_active: bool
    is_superuser: bool
    groups: list[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    store_id: int | None = None
    group_ids: list[int] | None = None
    is_active: bool | None = None


class RegisterRequest(BaseModel):
    store_name: str = Field(min_length=2, max_length=160)
    store_slug: Slug
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=220)
    permission_codes: list[str] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=220)
    permission_codes: list[str] | None = None


class GroupRead(BaseModel):
    id: int
    name: str
    description: str
    is_system: bool
    member_count: int
    permission_codes: list[str]


class PermissionRead(BaseModel):
    code: str
    description: str


class StoreCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: Slug
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=320)


class StoreUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=320)
    is_active: bool | None = None


class StoreRead(BaseModel):
    id: int
    tenant_id: int
    name: str
    slug: str
    phone: str | None
    address: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class OrderItem(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    quantity: Decimal = Field(gt=0, le=1000)
    unit_price: Decimal = Field(ge=0, le=1_000_000)
    notes: str | None = Field(default=None, max_length=300)


class OrderCreate(BaseModel):
    store_id: int
    external_id: str | None = Field(default=None, max_length=120)
    customer_name: str = Field(min_length=2, max_length=160)
    customer_phone: str = Field(min_length=5, max_length=32)
    delivery_address: str = Field(min_length=5, max_length=500)
    items: list[OrderItem] = Field(min_length=1, max_length=100)
    total_amount: Decimal = Field(ge=0, le=1_000_000)
    source: str = Field(default="api", max_length=40)
    notes: str | None = Field(default=None, max_length=2000)


class OrderUpdate(BaseModel):
    status: OrderStatus | None = None
    courier_user_id: int | None = None
    notes: str | None = Field(default=None, max_length=2000)


class OrderRead(BaseModel):
    id: int
    store_id: int
    external_id: str | None
    tracking_code: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    items: list[dict[str, Any]]
    total_amount: Decimal
    status: OrderStatus
    source: str
    courier_user_id: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicOrderRead(BaseModel):
    tracking_code: str
    store_name: str
    customer_name: str
    delivery_address: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    store_id: int
    scopes: list[str] = Field(min_length=1)


class ApiKeyRead(BaseModel):
    id: int
    name: str
    prefix: str
    scopes: list[str]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreated(ApiKeyRead):
    secret: str


class AuditRead(BaseModel):
    id: int
    actor_user_id: int | None
    action: str
    entity_type: str
    entity_id: str | None
    before_data: dict[str, Any] | None
    after_data: dict[str, Any] | None
    ip_address: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantRead(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


TokenResponse.model_rebuild()
