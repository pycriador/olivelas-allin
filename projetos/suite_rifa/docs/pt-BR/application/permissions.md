---
title: "Permissions & RBAC"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "APP-006"
type: "application"
---

# Permissões e RBAC

> Language: pt-BR | [English](../../en/application/permissions.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

O RaffleHub implementa um sistema de controle de acesso baseado em papéis de dois níveis: nível de plataforma (GLOBAL_ADMIN) e nível de organização (OWNER, ADMIN, MEMBER, VIEWER). As permissões são aplicadas em três camadas: UI do cliente, funções RPC e políticas RLS.

## Escopo

| Escopo | Notas |
| --- | --- |
| Papel da plataforma | GLOBAL_ADMIN (acesso irrestrito) |
| Papéis da organização | OWNER, ADMIN, MEMBER, VIEWER |
| 28 permissões | Armazenadas na tabela `role_permissions` |
| Camadas de aplicação | UI (PermissionGate), RPC (has_permission), RLS |

## Hierarquia de Papéis

| Papel | Nível | Descrição |
| --- | --- | --- |
| GLOBAL_ADMIN | Plataforma | Acesso irrestrito a todas as organizações e admin da plataforma |
| OWNER | Organização | Controle total da organização, pode transferir propriedade |
| ADMIN | Organização | A maioria das operações administrativas, não pode transferir propriedade |
| MEMBER | Organização | Visualização + operações limitadas |
| VIEWER | Organização | Acesso somente leitura |

## Matriz de Permissões

### Organização

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `organization.view` | Yes | Yes | Yes | Yes |
| `organization.update` | Yes | Yes | No | No |
| `organization.suspend` | Yes | No | No | No |

### Propriedade

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `ownership.transfer` | Yes | No | No | No |

### Usuários

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `users.view` | Yes | Yes | Yes | Yes |
| `users.invite` | Yes | Yes | No | No |
| `users.update` | Yes | Yes | No | No |
| `users.remove` | Yes | Yes | No | No |

### Papéis

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `roles.view` | Yes | Yes | Yes | Yes |
| `roles.update` | Yes | Yes | No | No |

### Faturamento e Uso

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `billing.view` | Yes | Yes | Yes | Yes |
| `usage.view` | Yes | Yes | Yes | Yes |

### Auditoria

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `audit.view` | Yes | Yes | No | No |

### Campanhas

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `campaigns.view` | Yes | Yes | Yes | Yes |
| `campaigns.create` | Yes | Yes | Yes | No |
| `campaigns.update` | Yes | Yes | Yes | No |
| `campaigns.publish` | Yes | Yes | Yes | No |
| `campaigns.pause` | Yes | Yes | Yes | No |
| `campaigns.finish` | Yes | Yes | Yes | No |
| `campaigns.archive` | Yes | Yes | No | No |
| `campaigns.restore` | Yes | Yes | No | No |
| `campaigns.manage_images` | Yes | Yes | Yes | No |

### Números

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `numbers.view` | Yes | Yes | Yes | Yes |
| `numbers.manage` | Yes | Yes | Yes | No |

### Reservas

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `reservations.view` | Yes | Yes | Yes | Yes |
| `reservations.manage` | Yes | Yes | Yes | No |

### Participantes

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `participants.view` | Yes | Yes | Yes | Yes |
| `participants.manage` | Yes | Yes | Yes | No |

### Vendas

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `sales.view` | Yes | Yes | Yes | Yes |
| `sales.manage` | Yes | Yes | Yes | No |

### Pagamentos

| Permissão | OWNER | ADMIN | MEMBER | VIEWER |
| --- | --- | --- | --- | --- |
| `payments.view` | Yes | Yes | Yes | Yes |
| `payments.manage` | Yes | Yes | Yes | No |

## Camadas de Aplicação

### Camada 1: UI do Cliente (Apenas Apresentação)

```typescript
// Componente PermissionGate
<PermissionGate permission="campaigns.create">
  <Button>Criar Campanha</Button>
</PermissionGate>
```

O hook `usePermissions()` busca chaves de permissão via RPC `my_permissions()`. O `PermissionGate` oculta/mostra elementos da UI. Isto é apenas apresentação — o banco de dados aplica as mesmas regras de forma independente.

### Camada 2: Funções RPC (Lógica de Negócio)

Toda função SECURITY DEFINER verifica permissões:

```sql
-- Dentro de toda função mutante:
IF NOT has_permission(_org_id, 'campaigns.create') THEN
  RAISE EXCEPTION 'Permission denied: campaigns.create';
END IF;
```

### Camada 3: Políticas RLS (Acesso a Dados)

Políticas RLS em todas as tabelas restringem quais linhas são visíveis:

```sql
-- Exemplo: SELECT em campaigns
CREATE POLICY campaigns_select_member ON campaigns
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND status = 'ACTIVE')
    OR status = 'PUBLISHED'  -- campanhas públicas visíveis para todos
  );
```

## Bypass do GLOBAL_ADMIN

O GLOBAL_ADMIN ignora todas as verificações a nível de organização:
- Cliente: A flag `isGlobalAdmin` faz todos os `can()`/`canWrite()` retornarem `true`
- Servidor: `has_permission()` retorna `true` para GLOBAL_ADMIN
- RLS: GLOBAL_ADMIN pode acessar dados de todas as organizações

## Restrições do Proprietário

- OWNER só pode ser atribuído via `transfer_ownership()` (requer digitar o nome da organização)
- OWNER não pode ser suspenso ou removido através do gerenciamento padrão de membros
- Auto-suspenção via `suspend_own_organization()` (requer confirmação)
- Reativação restrita a administradores da plataforma

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Autenticação | [auth.md](auth.md) |
| Segurança | [../security/overview.md](../security/overview.md) |
| Funções RPC | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
