---
title: "Security Overview"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "SEC-001"
type: "security"
---

# Visão Geral da Segurança

> Language: pt-BR | [English](../../en/security/overview.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Modelo de segurança do RaffleHub cobrindo limites de confiança, controle de acesso, proteção de dados e mitigação de ameaças.

## Limites de Confiança

| Limite | O que é protegido | Controles |
| --- | --- | --- |
| Isolamento de organização | Todos os dados no escopo da org | Políticas RLS + funções SECURITY DEFINER |
| Cliente ↔ Servidor | Execução de lógica de negócio | SECURITY DEFINER (todas as mutações server-side) |
| Público ↔ Autenticado | Navegação de campanhas vs. gerenciamento | Apenas `public_campaign()` e `public_campaign_numbers()` |
| Credenciais de pagamento | Chaves de API do gateway | Criptografia PGP em repouso |
| Dados do usuário | PII (nome, telefone, e-mail, documento) | RLS + sem visibilidade entre usuários |

## Autenticação

| Aspecto | Implementação |
| --- | --- |
| Provedor | Google OAuth via Supabase Auth (Lovable Cloud Auth) |
| Sessão | Baseada em JWT (access_token do Supabase) |
| Bootstrap | `bootstrap_session()` em cada login |
| Armazenamento de token | Cliente Supabase (cookies httpOnly quando suportado) |

## Autorização (RBAC)

Modelo de função de dois níveis:

| Nível | Funções | Escopo |
| --- | --- | --- |
| Plataforma | GLOBAL_ADMIN | Acesso irrestrito a todas as orgs |
| Organização | OWNER, ADMIN, MEMBER, VIEWER | Delimitado a uma única org |

28 permissões aplicadas em três camadas:

| Camada | Mecanismo | Propósito |
| --- | --- | --- |
| UI do Cliente | `PermissionGate` + `usePermissions()` | Ocultar/mostrar elementos da UI (apenas apresentação) |
| Funções RPC | Verificação `has_permission()` em cada função SECURITY DEFINER | Bloquear mutações não autorizadas |
| Políticas RLS | Segurança a nível de linha em cada tabela | Restringir visibilidade dos dados |

Veja [permissions.md](../application/permissions.md) para a matriz completa.

## Segurança a Nível de Linha (RLS)

Cada tabela tem RLS habilitado com políticas para:

| Tipo de Política | Comportamento |
| --- | --- |
| SELECT (membro) | Usuários podem ler linhas onde `organization_id` corresponde à sua membresia ativa |
| SELECT (público) | Campanhas publicadas e seus números visíveis para usuários anônimos |
| INSERT/UPDATE/DELETE | Bloqueado — todas as escritas via funções SECURITY DEFINER |

### Padrões RLS Principais

```sql
-- Acesso de membro: verificar organization_memberships
CREATE POLICY campaigns_select_member ON campaigns
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Acesso público: campanhas publicadas visíveis para todos
CREATE POLICY campaigns_select_public ON campaigns
  FOR SELECT USING (status = 'PUBLISHED');
```

### Prevenção de Bugs no RLS

Aliases de tabela em políticas RLS devem ser totalmente qualificados para evitar ambiguidade na resolução de colunas:

```sql
-- CORRETO: referências de coluna qualificadas
CREATE POLICY payments_select_public ON payments
  FOR SELECT USING (
    payments.campaign_id = campaigns.id
    AND campaigns.status = 'PUBLISHED'
    AND payments.status = 'CONFIRMED'
  );

-- ERRADO: 'status' não qualificado pode resolver para campaigns.status
-- em vez de payments.status
```

## Funções SECURITY DEFINER

Todas as operações de mutação passam por funções PostgreSQL com `SECURITY DEFINER`:

| Propriedade | Valor |
| --- | --- |
| Contexto de execução | Dono da função (tipicamente postgres) |
| Bypassa RLS | Sim (pode acessar todas as linhas) |
| Verificações auto-aplicadas | `auth.uid()`, `has_permission()`, `org_is_active()` |
| Search path | `SET search_path = public` |

### Padrão de Guarda de Função

Cada função segue esta sequência:

```sql
-- 1. Autenticação
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

-- 2. Contexto da organização
_org_id := org_id_from_context();

-- 3. Verificação de permissão
IF NOT has_permission(_org_id, 'domain.action') THEN
  RAISE EXCEPTION 'Permission denied';
END IF;

-- 4. Verificação de org ativa
IF NOT org_is_active(_org_id) THEN
  RAISE EXCEPTION 'Organization is not active';
END IF;

-- 5. Lock consultivo (para operações concorrentes)
PERFORM pg_advisory_xact_lock(hashtext('lock_name' || _org_id::text));

-- 6. Verificação de limite
IF NOT org_limit(_org_id, 'limit_name', increment := 1) THEN
  RAISE EXCEPTION 'Limit exceeded';
END IF;
```

## Proteção de Dados

### Tratamento de PII

| Dados | Armazenamento | Acesso | Observações |
| --- | --- | --- | --- |
| Perfil do usuário | Tabela `profiles` | Apenas próprio perfil (RLS) | Nome, e-mail, avatar |
| Dados do participante | Tabela `participants` | Apenas membros da org (RLS) | Nome, telefone, e-mail, documento |
| Informações do comprador | Tabela `payments` | Apenas membros da org (RLS) | Nome, telefone, e-mail, documento |
| Credenciais de pagamento | Tabela `payment_gateways` | Apenas membros da org (RLS) | Criptografado com PGP |

### Criptografia em Repouso

Credenciais do gateway são criptografadas usando `pgp_sym_encrypt` do PostgreSQL:

```sql
-- Criptografia
pgp_sym_encrypt($credentials, (SELECT value FROM app_settings WHERE key = 'payment_encryption_key'))

-- Descriptografia
pgp_sym_decrypt(credentials_encrypted, (SELECT value FROM app_settings WHERE key = 'payment_encryption_key'))
```

### Trilha de Auditoria

Cada ação significativa é registrada em `audit_logs`:

| Campo | Propósito |
| --- | --- |
| `actor_id` | Quem realizou a ação |
| `action` | O que foi feito (ex., CAMPAIGN_CREATED, PAYMENT_CONFIRMED) |
| `entity_type` | O que foi afetado (ex., campaign, payment) |
| `entity_id` | ID da entidade afetada |
| `metadata` | JSONB com contexto adicional |

## Mitigação de Ameaças

| Ameaça | Mitigação |
| --- | ---|
| Injeção SQL | Chamadas RPC parametrizadas, sem SQL bruto do cliente |
| Acesso cross-tenant | Políticas RLS + SECURITY DEFINER |
| Mutações não autorizadas | `has_permission()` em cada função |
| Condições de corrida | `pg_advisory_xact_lock` para operações concorrentes |
| Replay de webhook | `record_webhook_event()` idempotente com constraint UNIQUE |
| Exposição de credenciais | Criptografia PGP, nunca logado ou retornado ao cliente |
| Directory traversal | Validação de caminho em `/api/public/campaign-image` |
| Ataques de supply-chain | Bun `minimumReleaseAge = 24h` |

## Limitações de Segurança Conhecidas

| Limitação | Impacto | Classificação |
| --- | --- | --- |
| Sem rate limiting em endpoints públicos | Possível abuso de páginas públicas de campanhas | Confirmado |
| Sem verificação de assinatura de webhook | Webhooks confiados apenas pelo nome do provedor | Confirmado |
| Sem proteção CSRF além dos padrões do Supabase | Depende de cookies SameSite | Confirmado |
| Sem varredura automatizada de segurança | Apenas revisão manual | Confirmado |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Permissões | [../application/permissions.md](../application/permissions.md) |
| Autenticação | [../application/auth.md](../application/auth.md) |
| Modelo de dados | [../architecture/data-model.md](../architecture/data-model.md) |
| Funções RPC | [../contracts/rpc-functions.md](../contracts/rpc-functions.md) |
| Pagamentos | [../application/payments.md](../application/payments.md) |
