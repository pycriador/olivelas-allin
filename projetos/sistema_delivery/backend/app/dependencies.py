from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .config import settings
from .database import get_db
from .models import ApiKey, PermissionGroup, Tenant, User
from .security import hash_api_key

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(request: Request, token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user = None
    if token:
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
            user_id = int(payload["sub"])
            tenant_id = int(payload["tenant_id"])
        except (JWTError, KeyError, TypeError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado", headers={"WWW-Authenticate": "Bearer"}) from exc
        user = db.scalar(select(User).options(selectinload(User.groups).selectinload(PermissionGroup.permissions)).where(User.id == user_id, User.tenant_id == tenant_id))
    elif request.headers.get("X-API-Key"):
        raw_key = request.headers["X-API-Key"]
        key_record = db.scalar(select(ApiKey).where(ApiKey.secret_hash == hash_api_key(raw_key), ApiKey.is_active.is_(True)))
        if key_record:
            user = db.scalar(select(User).options(selectinload(User.groups).selectinload(PermissionGroup.permissions)).where(User.id == key_record.created_by_user_id, User.tenant_id == key_record.tenant_id, User.is_active.is_(True)))
            if user:
                request.state.api_scopes = set(key_record.scopes)
                request.state.api_key_id = key_record.id
                request.state.api_store_id = key_record.store_id
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação necessária", headers={"WWW-Authenticate": "Bearer"})
    tenant = db.get(Tenant, user.tenant_id)
    if not tenant or (not tenant.is_active and not user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant inativo")
    return user


def tenant_scope(user: User, request: Request) -> int:
    requested = request.headers.get("X-Tenant-ID")
    if requested and user.is_superuser:
        try:
            return int(requested)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="X-Tenant-ID inválido") from exc
    return user.tenant_id


def require_permission(code: str) -> Callable:
    def check_permission(request: Request, user: User = Depends(get_current_user)) -> User:
        if hasattr(request.state, "api_scopes"):
            if code not in request.state.api_scopes:
                raise HTTPException(status_code=403, detail=f"Credencial sem escopo: {code}")
            granted = {permission.code for group in user.groups for permission in group.permissions}
            if not user.is_superuser and code not in granted:
                raise HTTPException(status_code=403, detail="A permissão da conta vinculada foi revogada")
            return user
        if user.is_superuser:
            return user
        granted = {permission.code for group in user.groups for permission in group.permissions}
        if code not in granted:
            raise HTTPException(status_code=403, detail=f"Permissão necessária: {code}")
        return user
    return check_permission
