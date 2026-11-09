---
title: "Infraestrutura Supabase"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Infraestrutura Supabase

> Language: [English (EN)](../../en/infrastructure/supabase.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Documenta a configuração do projeto Supabase, schema de banco, storage, Edge Functions e hardening de segurança.

## Projeto

| Campo | Valor |
| --- | --- |
| Project ID | iukirkelywzlqkxlcyfk |
| Região | Não especificada |
| URL | Configurada via env var SUPABASE_URL |

## Schema do Banco

### Tabelas Principais

| Tabela | Propósito | Classificação |
| --- | --- | --- |
| image_analysis | Resultados de análise de imagem e metadados | Confirmed |
| iam_groups | Grupos IAM com cotas | Confirmed |
| iam_users | Usuários IAM com roles | Confirmed |
| iam_api_tokens | API tokens para auth de Edge Function | Confirmed |
| iam_prompts | Prompts de IA (visão, arte, custom) | Confirmed |
| ai_usage_logs | Rastreamento de custo por modelo/grupo | Confirmed |
| art_submissions | Fila de moderação de artes | Confirmed |

### Tabela: image_analysis

| Coluna | Tipo | Default | Notas |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Chave primária |
| created_at | timestamptz | now() | Indexada |
| image_url | text | — | URL assinada |
| image_path | text | — | Caminho no storage |
| image_type | text | — | Tipo MIME |
| business_name | text | — | Nome extraído |
| category | text | — | Categoria da imagem |
| title | text | — | Título extraído |
| summary | text | — | Resumo da IA |
| searchable_text | text | — | Busca full-text |
| keywords | text[] | — | Palavras-chave extraídas |
| confidence | numeric | — | Faixa 0-1 |
| analysis | jsonb | — | JSON estruturado completo |
| phash | text | — | Hash perceptual |
| processing_version | text | — | Versão prompt/modelo |
| model_used | text | — | Identificador do modelo de IA |
| status | text | 'pending' | pending/processing/completed/failed |
| error_message | text | — | Detalhes do erro |

### Tabela: iam_groups

| Coluna | Tipo | Default | Notas |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Chave primária |
| name | text | — | Nome do grupo |
| description | text | — | Descrição do grupo |
| quota_brl | numeric | 200 | Cota mensal em BRL |
| used_brl | numeric | 0 | Uso atual |
| gemini_api_key | text | — | Chave Gemini por grupo |
| gemini_model | text | 'gemini-2.5-flash' | Modelo Gemini |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | Atualizado automaticamente |

### Tabela: iam_users

| Coluna | Tipo | Default | Notas |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Chave primária |
| email | text | — | Único |
| role | text | — | CHECK: global_admin/analyst/consumer |
| group_ids | uuid[] | — | Grupos associados |
| custom_quota_brl | numeric | — | Override por usuário |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | Atualizado automaticamente |

## Buckets de Storage

| Bucket | Propósito | Expiração de URL assinada | Classificação |
| --- | --- | --- | --- |
| images | Imagens enviadas pelo usuário | 7 dias | Confirmed |
| generated-arts | Imagens geradas por IA | 30 dias | Confirmed |

## Edge Functions

| Função | Propósito | Auth | Classificação |
| --- | --- | --- | --- |
| analyze-image | Análise de imagem server-side | JWT ou API token | Confirmed |

### Edge Function: analyze-image

| Campo | Valor |
| --- | --- |
| Runtime | Deno (edge-runtime) |
| Entrada | { id, path, imageUrl } |
| Auth | JWT Bearer OU X-API-Key (hash SHA-256) |
| Provedor de IA | OpenAI chat completions OU gateway Lovable |
| Modelo default | gpt-4o / openai/gpt-4.1-mini |
| Max tokens | 4096 |
| Formato de resposta | json_object |
| Versão de processamento | v1 |

## Hardening de Segurança

| Função | Propósito | Segurança |
| --- | --- | --- |
| is_global_admin() | Verificar role de admin | SECURITY INVOKER, SET search_path = public |
| is_admin_or_analyst() | Verificar admin/analyst | SECURITY INVOKER, SET search_path = public |
| get_auth_role() | Obter role do usuário | SECURITY INVOKER, SET search_path = public |

Todas as funções:
- REVOKE de public/anon
- GRANT para authenticated/service_role
- Email hardcoded para verificação de global admin

## Migrations

| Migration | Propósito | Classificação |
| --- | --- | --- |
| 20260910_iam_system.sql | Tabelas IAM (grupos, usuários, tokens) | Confirmed |
| 20260910_prompts_and_usage_logs.sql | Prompts e rastreamento de uso | Confirmed |
| 20260910_complete_iam_and_client_system.sql | Submissões de artes, consolidação | Confirmed |
| 20260910_security_hardening.sql | Funções de segurança, hardening RLS | Confirmed |
| 0000_create_image_analysis.sql | Tabela principal de análise | Confirmed |
| 0001_images_bucket_policies.sql | Políticas de storage | Confirmed |
| 0002_add_gemini_model_to_iam_groups.sql | Coluna de modelo Gemini | Confirmed |
| 0002_add_embeddings_and_search.sql | Extensão vector, índice FTS | Confirmed |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Segurança | [seguranca/seguranca.md](../seguranca/seguranca.md) |
| Contratos | [contratos/](../contratos/) |