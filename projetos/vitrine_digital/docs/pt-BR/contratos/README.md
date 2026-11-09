---
title: "Contratos"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Contratos

> Language: [English (EN)](../../en/contracts/README.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Contratos técnicos definem fronteiras explícitas entre participantes do sistema. Cada contrato especifica regras de interação que produtor e consumidor devem respeitar.

## Índice de Contratos

| Contrato | Produtor | Consumidor | Protocolo | Documentação |
| --- | --- | --- | --- | --- |
| Análise de Visão IA | Provedor de IA (Lovable/OpenAI/Gemini) | TanStack Start App | REST (SSE em streaming) | [arquitetura.md](../arquitetura.md) |
| Geração de Artes IA | Provedor de IA (Lovable/Gemini) | TanStack Start App | REST | [arquitetura.md](../arquitetura.md) |
| Supabase Storage | Supabase | TanStack Start App | Compatível com S3 | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |
| Supabase Auth | Supabase | TanStack Start App | JWT/REST | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |
| Edge Function (analyze-image) | Edge Function Supabase | Supabase Postgres | REST | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |
| Auth por Token IAM | Edge Function | iam_api_tokens | Lookup hash SHA-256 | [arquitetura.md](../arquitetura.md) |

## Contrato: Análise de Visão IA

| Campo | Valor |
| --- | --- |
| Produtor | Gateway Lovable IA / OpenAI API / Gemini API |
| Consumidor | TanStack Start App (server function analyzeImage) |
| Protocolo | REST (HTTP POST) com SSE em streaming |
| Entrada | Imagem (dataURL ou base64) + prompt de visão |
| Saída | SSE em streaming com JSON estruturado |
| Schema | Validação Zod (analysisSchema) |
| Timeout | Depende do provedor (tipicamente 30-60s) |
| Retry | Não implementado — tentativa única |
| Idempotência | Não garantida — re-análise pode produzir resultados diferentes |
| Tratamento de erros | 429 (rate limit) → erro, 402 (quota) → erro |

## Contrato: Geração de Artes IA

| Campo | Valor |
| --- | --- |
| Produtor | Gateway Lovable IA (DALL-E 3/Flux) / Gemini (Imagen 3) |
| Consumidor | TanStack Start App (server function generateArtImageDirect) |
| Protocolo | REST (HTTP POST) |
| Entrada | Imagem de referência + prompt de arte + parâmetros (tamanho, estilo) |
| Saída | Dados de imagem b64_json |
| Tamanhos | 1024x1792, 1792x1024, 1024x1024 |
| Timeout | Depende do provedor (tipicamente 30-120s) |
| Custo | R$0,15 por geração (debitado da cota do grupo) |

## Contrato: Supabase Storage

| Campo | Valor |
| --- | --- |
| Produtor | Supabase Storage |
| Consumidor | TanStack Start App, Edge Function |
| Protocolo | REST compatível com S3 |
| Buckets | `images` (uploads), `generated-arts` (saída IA) |
| URLs assinadas | 7 dias (uploads), 30 dias (artes geradas) |
| Tipos MIME | image/jpeg, image/png, image/webp |

## Contrato: Verificação de Cota IAM

| Campo | Valor |
| --- | --- |
| Produtor | Sistema IAM (server functions) |
| Consumidor | Pipeline de Visão IA, Geração de Artes IA |
| Protocolo | Chamada de função em processo |
| Entrada | group_id |
| Saída | { allowed: boolean, remaining_brl: number } |
| Custo por análise | R$0,05 |
| Custo por geração de arte | R$0,15 |
| Aplicação | Pré-verificação antes da chamada de IA + débito pós-sucesso |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Fluxo de dados | [fluxo-de-dados.md](../fluxo-de-dados.md) |
| Segurança | [seguranca/seguranca.md](../seguranca/seguranca.md) |