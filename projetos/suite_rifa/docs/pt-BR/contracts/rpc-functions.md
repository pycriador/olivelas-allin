---
title: "RPC Functions"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "CTR-001"
type: "contracts"
---

# Funções RPC

> Language: pt-BR | [English](../../en/contracts/rpc-functions.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Catálogo completo de todas as funções PostgreSQL SECURITY DEFINER expostas via Supabase RPC. Toda mutação no RaffleHub passa por essas funções — o cliente nunca escreve diretamente nas tabelas.

## Padrão

Todas as funções seguem esta estrutura:

```sql
CREATE OR REPLACE FUNCTION function_name(_param TYPE)
RETURNS TYPE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
BEGIN
  -- 1. Get organization context
  _org_id := org_id_from_context();

  -- 2. Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 3. Check permission
  IF NOT has_permission(_org_id, 'permission.key') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 4. Check org is active
  IF NOT org_is_active(_org_id) THEN
    RAISE EXCEPTION 'Organization is not active';
  END IF;

  -- 5. Advisory lock (for concurrent operations)
  PERFORM pg_advisory_xact_lock(hashtext('lock_name' || _org_id::text));

  -- 6. Check org limits
  IF NOT org_limit(_org_id, 'limit_name', increment := 1) THEN
    RAISE EXCEPTION 'Limit exceeded';
  END IF;

  -- 7. Business logic
  -- ...

  -- 8. Audit
  PERFORM write_audit(_org_id, 'ACTION', 'entity', entity_id, jsonb_build_object(...));

  RETURN result;
END;
$$;
```

## Funções de Organização

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `bootstrap_session()` | — | JSONB | authenticated | Criar/atualizar perfil, auto-promover GLOBAL_ADMIN |
| `create_organization()` | `_name, _slug, _email` | UUID | authenticated | Criar org + membresia OWNER |
| `suspend_own_organization()` | `_org_id` | VOID | organization.suspend | Auto-suspender org |
| `set_organization_status()` | `_org_id, _status` | VOID | GLOBAL_ADMIN | Definir status da org (reativar) |
| `set_organization_logo()` | `_org_id, _logo_url` | VOID | organization.update | Definir logo da org |

## Funções de Membresia

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `invite_member()` | `_org_id, _email, _role` | UUID | users.invite | Enviar convite |
| `resend_invitation()` | `_invitation_id` | VOID | users.invite | Reenviar e-mail de convite |
| `revoke_invitation()` | `_invitation_id` | VOID | users.invite | Revogar convite pendente |
| `preview_invitation()` | `_token_hash` | JSONB | authenticated | Visualizar detalhes do convite |
| `accept_invitation()` | `_token` | UUID | authenticated | Aceitar convite por token |
| `change_member_role()` | `_org_id, _user_id, _new_role` | VOID | roles.update | Alterar função do membro |
| `set_member_status()` | `_org_id, _user_id, _new_status` | VOID | users.update | Suspender/reativar membro |
| `remove_member()` | `_org_id, _user_id` | VOID | users.remove | Remover membro da org |
| `transfer_ownership()` | `_org_id, _new_owner_id` | VOID | ownership.transfer | Transferir função OWNER |
| `list_organization_members()` | `_org_id, _search, _role, _status, _limit, _offset` | JSONB | users.view | Lista paginada de membros |

## Funções de Permissão

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `my_permissions()` | `_org_id` | TEXT[] | authenticated | Retornar chaves de permissão do usuário |

## Funções de Campanha

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `create_campaign()` | `_org_id, _name, _description, _product_name, _product_description, _total_numbers, _number_price, _currency, _start_date, _end_date` | UUID | campaigns.create | Criar nova campanha |
| `update_campaign()` | `_campaign_id, _name, _description, _product_name, _product_description, _number_price, _start_date, _end_date` | VOID | campaigns.update | Atualizar campos da campanha |
| `set_campaign_status()` | `_campaign_id, _new_status` | VOID | campaigns.publish/pause/finish/archive/restore | Transição de status |
| `list_campaigns()` | `_org_id, _search, _status, _sort, _limit, _offset` | JSONB | campaigns.view | Lista paginada |
| `campaign_metrics()` | `_org_id` | JSONB | campaigns.view | Contagens por status |
| `public_campaign()` | `_slug` | JSONB | anon | Visualização pública segura |

## Funções de Imagem de Campanha

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `add_campaign_image()` | `_campaign_id, _url, _type` | UUID | campaigns.manage_images | Adicionar imagem |
| `delete_campaign_image()` | `_image_id` | VOID | campaigns.manage_images | Remover imagem |
| `set_campaign_cover()` | `_campaign_id, _image_id` | VOID | campaigns.manage_images | Definir capa |
| `reorder_campaign_images()` | `_campaign_id, _image_ids` | VOID | campaigns.manage_images | Reordenar galeria |

## Funções de Número

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `generate_campaign_numbers()` | `_campaign` | VOID | numbers.manage | Inserção em massa de números AVAILABLE |
| `admin_block_numbers()` | `_campaign, _numbers` | VOID | numbers.manage | Definir números como BLOCKED |
| `admin_unblock_numbers()` | `_campaign, _numbers` | VOID | numbers.manage | Definir BLOCKED como AVAILABLE |
| `list_campaign_numbers_admin()` | `_campaign, _status, _search, _limit, _offset` | JSONB | numbers.view | Lista paginada |
| `campaign_number_metrics()` | `_campaign` | JSONB | numbers.view | Contagens por status |
| `public_campaign_numbers()` | `_slug` | JSONB | anon | Visualização pública segura |

## Funções de Reserva

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `reserve_numbers()` | `_campaign, _numbers` | UUID | reservations.manage | Criar retenção com tempo limitado |
| `cancel_reservation()` | `_reservation_id` | VOID | reservations.manage | Liberar números retidos |
| `get_active_reservation()` | `_campaign` | JSONB | reservations.view | Obter reserva ativa atual |
| `admin_cancel_reservation()` | `_reservation_id` | VOID | reservations.manage | Cancelamento admin |

## Funções de Participante

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `create_participant()` | `_campaign_id, _name, _phone, _email, _document, _notes` | UUID | participants.manage | Criar participante |
| `update_participant()` | `_participant_id, _name, _phone, _email, _document, _notes` | VOID | participants.manage | Atualizar participante |
| `list_participants()` | `_campaign_id, _search, _limit, _offset` | JSONB | participants.view | Lista paginada |
| `get_participant_history()` | `_participant_id` | JSONB | participants.view | Histórico completo |
| `export_participants_csv()` | `_campaign_id` | TEXT | participants.view | Exportação CSV |

## Funções de Venda

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `quick_sale()` | `_campaign_id, _numbers, _name, _phone, _payment_method` | UUID | sales.manage | Atomicamente: criar participante + venda + marcar SOLD |
| `create_manual_sale()` | `_campaign_id, _participant_id, _numbers, _payment_method, _amount, _notes` | UUID | sales.manage | Criar venda manual |
| `update_manual_sale()` | `_sale_id, _payment_method, _amount, _notes` | VOID | sales.manage | Atualizar venda |
| `cancel_manual_sale()` | `_sale_id` | VOID | sales.manage | Cancelar venda (reverter números) |
| `transfer_numbers()` | `_from_participant_id, _to_participant_id, _numbers` | VOID | sales.manage | Mover números entre participantes |
| `list_manual_sales()` | `_campaign_id, _search, _limit, _offset` | JSONB | sales.view | Lista paginada |
| `campaign_sales_metrics()` | `_campaign_id` | JSONB | sales.view | Métricas de receita e contagem |
| `export_sales_csv()` | `_campaign_id` | TEXT | sales.view | Exportação CSV |

## Funções de Pagamento

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `create_payment()` | `_reservation_id, _gateway_id, _method, _buyer_name, _buyer_phone, _buyer_email, _buyer_document` | UUID | payments.manage | Criar pagamento pendente |
| `update_payment_status()` | `_payment_id, _new_status` | VOID | payments.manage | Atualizar status |
| `confirm_payment()` | `_payment_id` | VOID | payments.manage | Confirmar: marcar números SOLD, criar venda |
| `cancel_payment()` | `_payment_id` | VOID | payments.manage | Cancelar pagamento |
| `get_payment()` | `_payment_id` | JSONB | payments.view | Obter pagamento por ID |
| `public_get_payment()` | `_payment_id` | JSONB | anon | Visualização pública segura |
| `list_payments()` | `_campaign_id, _status, _search, _limit, _offset` | JSONB | payments.view | Lista paginada |
| `campaign_payment_metrics()` | `_campaign_id` | JSONB | payments.view | Métricas de receita e contagem |

## Funções de Gateway

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `create_payment_gateway()` | `_org_id, _provider, _name, _credentials, _settings` | UUID | payments.manage | Criar configuração de gateway |
| `update_payment_gateway()` | `_gateway_id, _name, _credentials, _settings, _is_active` | VOID | payments.manage | Atualizar configuração de gateway |
| `delete_payment_gateway()` | `_gateway_id` | VOID | payments.manage | Excluir configuração de gateway |
| `list_payment_gateways()` | `_org_id` | JSONB | payments.view | Listar configurações de gateway |

## Funções de Administração da Plataforma

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `platform_metrics()` | — | JSONB | GLOBAL_ADMIN | Métricas da plataforma |
| `platform_list_organizations()` | `_search, _status, _limit, _offset` | JSONB | GLOBAL_ADMIN | Listar todas as orgs |
| `platform_list_users()` | `_search, _limit, _offset` | JSONB | GLOBAL_ADMIN | Listar todos os usuários |
| `platform_organization_detail()` | `_org_id` | JSONB | GLOBAL_ADMIN | Detalhe da org com membros |

## Funções de Auditoria

| Função | Parâmetros | Retorna | Permissão | Propósito |
| --- | --- | --- | --- | --- |
| `list_audit_logs()` | `_org_id, _action, _entity, _actor, _limit, _offset` | JSONB | audit.view | Log de auditoria paginado |
| `write_audit()` | `_org_id, _action, _entity, _entity_id, _metadata` | VOID | (internal) | Gravar entrada de auditoria |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Rotas da API | [api-routes.md](api-routes.md) |
| Modelo de dados | [../architecture/data-model.md](../architecture/data-model.md) |
| Segurança | [../security/overview.md](../security/overview.md) |
| Permissões | [../application/permissions.md](../application/permissions.md) |
