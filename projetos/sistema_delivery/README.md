# Olivelas Delivery

Sistema multi-tenant para centralizar pedidos de delivery, organizar o trabalho da loja e acompanhar entregas. A interface atual é um mock navegável; a API FastAPI já oferece autenticação, persistência, RBAC/HBAC, pedidos, integrações, auditoria e rastreamento público.

## Stack

- Frontend: React, TypeScript, Vite e React Router.
- API: Python, FastAPI, Pydantic e SQLAlchemy 2.
- Persistência padrão: SQLite local. A configuração aceita PostgreSQL/Supabase e MariaDB via `DATABASE_URL`.
- Especificações e decisões: [`sdd/`](./sdd/00-index.md).

## Executar o frontend

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`. O painel demonstrativo aceita pedidos e mudanças de status locais; esse estado fica no `localStorage` do navegador e **não é a API**. Os formulários de login e cadastro são apenas visuais nesta etapa.

## Executar a API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

- OpenAPI/Swagger: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`
- Health check: `http://localhost:8000/api/v1/health`
- SQLite padrão: `backend/olivelas.db`

Crie uma conta de loja por `POST /api/v1/auth/register`, depois use o token Bearer em `/docs`. Para provisionar um superusuário da plataforma, execute `python -m app.bootstrap --email admin@example.com --name "Admin da Plataforma"` a partir de `backend`; a senha é solicitada sem eco no terminal.

Configure `JWT_SECRET_KEY` antes de qualquer implantação e defina `ENVIRONMENT=production` em produção. `DATABASE_URL` aceita, por exemplo:

```text
sqlite:///./olivelas.db
postgresql+psycopg://usuario:senha@host:5432/olivelas
mysql+pymysql://usuario:senha@host:3306/olivelas
```

Supabase usa o driver PostgreSQL. Prefira o pooler/URL de servidor apropriado ao ambiente de execução; não exponha credenciais no frontend. Para iniciar a integração com o atendimento, crie uma chave de API com escopo `orders.create` e envie `X-API-Key` para `POST /api/v1/integrations/whatsapp/orders`.

## Verificação

```powershell
npm run build
cd backend
pip install -r requirements-dev.txt
pytest
```

Antes de produção: migrations com Alembic, integração de autenticação no frontend, rate limiting no gateway, revisão operacional das políticas, backup/restore e testes de concorrência.
