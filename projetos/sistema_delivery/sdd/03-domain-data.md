# Domínio e dados

## Entidades da implementação inicial

| Entidade | Campos-chave / propósito | Isolamento |
|---|---|---|
| `Tenant` | `id`, nome, slug único, ativo, criado em. Fronteira do cliente SaaS. | Raiz. |
| `Store` | `tenant_id`, nome, slug global, contato/endereço e ativo. Unidade operacional. | Tenant. |
| `User` | `tenant_id`, `store_id` inicial opcional, e-mail global único, nome, hash de senha, ativo, superusuário. | Tenant; loja opcional. |
| `Permission` | `code` e descrição do catálogo global. | Catálogo compartilhado, sem dados operacionais. |
| `PermissionGroup` | tenant, nome, descrição, flag de grupo de sistema; relação N:N com usuários e permissões. | Tenant. |
| `DeliveryOrder` | tenant/loja, identificador externo, tracking code aleatório, cliente/endereço, itens JSON, total decimal, status, origem, entregador, timestamps. | Tenant + loja. |
| `ApiKey` | tenant/loja, criador, prefixo, hash do segredo, escopos, ativo e criado em. | Tenant + loja. |
| `AuditLog` | tenant, ator, ação, tipo/id da entidade, before/after, IP e timestamp. | Tenant; evento de login de usuário desconhecido pode ter tenant nulo. |

`user_groups` e `group_permissions` são tabelas associativas. O banco aplica chaves estrangeiras e índices de consulta básicos.

## Catálogo inicial de permissões

`stores.read`, `stores.manage`, `orders.read`, `orders.create`, `orders.update`, `orders.assign`, `users.read`, `users.manage`, `groups.read`, `groups.manage`, `permissions.read`, `audit.read`, `integrations.read`, `integrations.manage`, `tenants.manage`.

Cada permissão representa uma operação; a API é a autoridade final, independente de esconder botões no frontend.

## Regras de consistência

- `User.email` é único globalmente na V1 para permitir login por e-mail sem tenant slug.
- Um grupo só pode ser associado a usuários e lojas do próprio tenant.
- Um `external_id` não se repete dentro de um tenant; uma repetição retorna 409 e inclui a referência ao pedido já recebido.
- O valor total deve ser igual à soma quantidade × preço unitário, arredondada a centavos.
- O tracking code usa token aleatório e único, não o ID incremental.
- A API não permite status fora de ordem nem retorno a partir de Entregue.
- Exclusões que poderiam apagar histórico são soft-delete/inativação. Só grupos não sistêmicos podem ser excluídos.
- Chaves são representadas ao usuário pelo prefixo e nunca podem ser lidas novamente em claro.

## Evolução de schema

Adotar Alembic antes de persistir dados de cliente em produção. Planejar índices compostos `(tenant_id, store_id, created_at)` em pedidos/auditoria, associação `user_stores`, catálogo de produtos opcional e linhas de itens normalizadas se consultas analíticas/reconciliação passarem a exigir isso. Não migrar dados sem revisão de tenants e constraints.
