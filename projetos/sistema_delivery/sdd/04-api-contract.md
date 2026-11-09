# Contrato da API V1

Base URL: `/api/v1`. JSON UTF-8; erros FastAPI usam `{"detail": ...}`. Listas aceitam `limit` e `offset` quando documentado. Datas em ISO-8601.

## Autenticação

- Cadastro: `POST /auth/register`, JSON `{store_name, store_slug, full_name, email, password}`. Resposta 201 com `{access_token, token_type, expires_in, user}`.
- Login: `POST /auth/login`, formulário OAuth2 (`username` é e-mail, `password`).
- Logout: `POST /auth/logout` (audita e instrui descarte do token; JWT não tem revogação individual V1).
- Rotas privadas: `Authorization: Bearer <JWT>`.
- Credencial de canal: `X-API-Key: <segredo>`. O segredo aparece uma única vez em `POST /api-keys`.
- `X-Tenant-ID` só seleciona tenant com superusuário; não é uma declaração de tenant confiável para contas comuns.

## Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | Público | Estado básico do serviço. |
| GET | `/auth/me` | Bearer | Retorna o perfil e grupos da sessão atual. |
| GET | `/permissions` | `permissions.read` | Catálogo global de código/descrição. |
| GET, POST | `/stores` | `stores.read`, `stores.manage` | Lista lojas visíveis; cria loja no tenant ativo. |
| PATCH, DELETE | `/stores/{store_id}` | `stores.manage` | Atualiza ou desativa uma loja. DELETE é soft. |
| GET, POST | `/users` | `users.read`, `users.manage` | Lista/cria usuários; criação aceita `group_ids`, `store_id`, senha inicial. |
| PATCH, DELETE | `/users/{user_id}` | `users.manage` | Atualiza nome, loja, grupos, ativo; DELETE desativa. |
| GET, POST | `/groups` | `groups.read`, `groups.manage` | Lista/cria grupos; criação recebe `permission_codes`. |
| PATCH, DELETE | `/groups/{group_id}` | `groups.manage` | Atualiza nome/descrição/permissões; grupo de sistema não pode ser removido ou renomeado. |
| GET | `/orders` | `orders.read` | Filtros opcionais `store_id`, `status`, `limit` (1–200) e `offset`. |
| POST | `/orders` | `orders.create` | Recebe pedido manual/API, gera status inicial e tracking code. |
| GET | `/orders/{order_id}` | `orders.read` | Obtém pedido acessível por tenant, loja e regra de entregador. |
| PATCH | `/orders/{order_id}` | `orders.update` | Atualiza status, entregador e observações; status deve ser a etapa seguinte. Atribuição exige `orders.assign`. |
| POST | `/integrations/whatsapp/orders` | API key `orders.create` ou usuário com `orders.create` | Ingestão de pedidos do sistema de atendimento; origem registrada como WhatsApp. |
| GET | `/public/tracking/{tracking_code}` | Público | Status, nome da loja, nome do cliente, endereço e timestamps. Não recebe o ID da entidade. |
| GET | `/audit` | `audit.read` | Auditoria paginada (máximo 500 itens por chamada). |
| GET | `/api-keys` | `integrations.read` | Metadados de credenciais, sem segredo/hash. |
| POST | `/api-keys` | `integrations.manage` | Cria credencial vinculada a `store_id`, `name` e `scopes`; retorna segredo apenas uma vez. |
| DELETE | `/api-keys/{key_id}` | `integrations.manage` | Revoga a credencial. |
| GET | `/admin/tenants` | Superusuário (`tenants.manage`) | Lista tenants para administração global. |

## Pedido de entrada

```json
{
  "store_id": 1,
  "external_id": "atendimento-7841",
  "customer_name": "Maria Silva",
  "customer_phone": "+5511999990000",
  "delivery_address": "Rua Exemplo, 10",
  "items": [{"name": "Bowl", "quantity": 2, "unit_price": 25.50}],
  "total_amount": 51.00,
  "source": "api",
  "notes": "Sem cebola"
}
```

No webhook, `external_id` deve ser estável para suportar idempotência. A API responde 409 em duplicata, 403 quando loja/escopo não correspondem, 404 para recursos inexistentes e 422 para dados inválidos/total divergente. Ainda não há autenticação assinada de webhook independente da API key, entrega assíncrona ou retries gerenciados.

## Documentação de máquina

Swagger: `/docs`; ReDoc: `/redoc`; OpenAPI: `/api/v1/openapi.json`. Atualizar este arquivo em qualquer alteração de método, rota, schema, status ou escopo.
