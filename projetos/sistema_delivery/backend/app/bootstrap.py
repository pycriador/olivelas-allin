import argparse
from getpass import getpass

from sqlalchemy import select

from .api import make_store_groups, slugify
from .database import Base, SessionLocal, engine
from .models import Store, Tenant, User
from .security import hash_password


def main():
    parser = argparse.ArgumentParser(description="Provisiona uma conta de superusuário da plataforma.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--tenant-slug", default="olivelas-platform")
    args = parser.parse_args()

    password = getpass("Senha (mínimo 10 caracteres): ")
    if len(password) < 10:
        parser.error("A senha precisa ter no mínimo 10 caracteres.")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        email = args.email.lower()
        if db.scalar(select(User.id).where(User.email == email)):
            parser.error("Este e-mail já possui uma conta.")
        slug = slugify(args.tenant_slug)
        tenant = Tenant(name="Olivelas Platform", slug=slug)
        db.add(tenant)
        db.flush()
        store = Store(tenant_id=tenant.id, name="Platform", slug=f"{slug}-platform")
        db.add(store)
        db.flush()
        owner_group = make_store_groups(db, tenant.id)
        db.add(User(
            tenant_id=tenant.id, store_id=store.id, email=email, full_name=args.name,
            password_hash=hash_password(password), is_superuser=True, groups=[owner_group],
        ))
        db.commit()
        print(f"Superusuário provisionado: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
