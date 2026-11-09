# Arquitetura e decisões

## Visão lógica

```text
Atendimento WhatsApp ── X-API-Key ──┐
Frontend React ───────── Bearer JWT ─┼── FastAPI /api/v1 ── SQLAlchemy ── SQLite
Cliente público ─────── tracking code┘                         ├──────── PostgreSQL/Supabase
                                                               └──────── MariaDB
```

## Componentes

- `src/`: SPA React/TypeScript com Vite. `App.tsx` contém os fluxos de mock; `data.ts` e tipos definem as amostras.
- `backend/app/main.py`: criação FastAPI, CORS, OpenAPI e inicialização de tabelas de desenvolvimento.
- `backend/app/api.py`: rotas versionadas, regras de autorização e aplicação de regras de domínio.
- `backend/app/models.py`: entidades SQLAlchemy e tabelas associativas.
- `backend/app/schemas.py`: contratos de entrada/saída e validação.
- `backend/app/dependencies.py`: sessão, autenticação, tenant e verificação de permissão.
- `backend/app/security.py`: hash de senha, JWT e digest de API key.
- `sdd/`: decisões e contratos compartilhados pelo time/agentes.

## Decisões V1

1. SQLite é o padrão local para onboarding simples. A camada usa SQLAlchemy; altere `DATABASE_URL` para PostgreSQL (incluindo Supabase) ou MariaDB e instale o driver correspondente. Verificar índices, constraints, JSON e comportamento de timezone em cada dialeto antes de produção.
2. REST versionada em `/api/v1`; OpenAPI é derivado das rotas FastAPI.
3. JWT HS256 de curta duração para pessoas, enviado como Bearer. API keys separadas, armazenadas apenas como SHA-256, enviadas no header `X-API-Key`.
4. `X-Tenant-ID` só é aceito para selecionar contexto por uma conta superusuário. Para demais contas, o tenant vem do JWT e é imutável no request.
5. A conta de usuário é globalmente identificada por e-mail e pertence a um tenant e uma loja inicial (esta última pode ser nula). A associação de múltiplos usuários a múltiplas lojas requer migrar `User.store_id` para associação explícita tenant/store.
6. Integrações são vinculadas a uma loja por credencial e limitadas por escopos. Recomendação: uma chave por sistema/loja/ambiente.
7. `create_all` é somente conveniência de protótipo. Introduzir Alembic antes de alteração de schema em dados reais.
8. O frontend não acessa o backend ainda. Manter mocks explicitamente nomeados até que cliente HTTP, sessão, erros e loading states sejam ligados às rotas.

## Operação e observabilidade a implementar

- Segredos somente no ambiente do backend/secret manager; `.env` não versionado.
- Em produção use TLS, proxy de confiança configurado, origens CORS específicas, rate limiting, monitoramento de erro, backups criptografados e política de retenção.
- Implementar logging estruturado e request/correlation ID sem payload de pedidos, headers de autorização, senhas ou PII.
- Deploy separado de frontend/API; serviço FastAPI sem filesystem efêmero quando o banco for SQLite persistente. Em múltiplas instâncias, usar PostgreSQL/MariaDB.
