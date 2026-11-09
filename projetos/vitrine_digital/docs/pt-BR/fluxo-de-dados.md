---
title: "Fluxo de Dados"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Fluxo de Dados

> Language: [English (EN)](../en/data-flow.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Descreve os fluxos de dados primários através do sistema AI WhatsApp Image Analyzer.

## Fluxo 1: Análise de Imagem (Principal)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant App as TanStack Start
    participant Stor as Supabase Storage
    participant AI as Provedor de IA
    participant DB as Supabase Postgres

    U->>App: Upload da imagem (drag-drop / share target)
    App->>Stor: Upload para bucket images
    Stor-->>App: Caminho da imagem
    App->>App: Calcular pHash (8x8)
    App->>DB: INSERT image_analysis (status: pending)
    App->>App: analyzeImage(serverFn)
    App->>Stor: Download da imagem
    Stor-->>App: Dados da imagem
    App->>App: Converter para dataURL
    App->>AI: Prompt de visão + imagem
    AI-->>App: Resposta SSE em streaming
    App->>App: Parse JSON (extração regex)
    App->>App: Validar contra schema Zod
    App->>DB: UPDATE image_analysis (status: completed)
    App->>DB: INSERT ai_usage_logs (custo: R$0,05)
    App-->>U: Exibir resultado da análise
```

### Entidades de Dados

| Entidade | Fonte | Destino | Formato |
| --- | --- | --- | --- |
| Arquivo de imagem | Dispositivo do usuário | Supabase Storage | JPEG/PNG/WebP |
| URL assinada | Supabase Storage | Servidor da aplicação | URL (expiração 7 dias) |
| pHash | Cálculo da aplicação | image_analysis.phash | Matriz binária 8x8 |
| Prompt de visão | iam_prompts / ANALYSIS_PROMPT | Provedor de IA | String |
| Resposta da IA | Provedor de IA | Servidor da aplicação | JSON SSE em streaming |
| Resultado da análise | Validação da aplicação | image_analysis.analysis | JSONB |
| Log de uso | Servidor da aplicação | ai_usage_logs | Linha (custo, modelo, status) |

### Schema: image_analysis

| Coluna | Tipo | Propósito |
| --- | --- | --- |
| id | uuid | Chave primária |
| image_url | text | URL assinada da imagem |
| image_path | text | Caminho no storage |
| image_type | text | Tipo MIME |
| business_name | text | Nome do negócio extraído |
| category | text | Categoria da imagem |
| title | text | Título extraído |
| summary | text | Resumo gerado pela IA |
| searchable_text | text | Conteúdo para busca full-text |
| keywords | text[] | Palavras-chave extraídas |
| confidence | numeric | Confiança da IA (0-1) |
| analysis | jsonb | JSON estruturado completo |
| phash | text | Hash perceptual |
| processing_version | text | Versão do prompt/modelo |
| model_used | text | Identificador do modelo de IA |
| status | text | pending/processing/completed/failed |
| error_message | text | Detalhes do erro se falhou |
| created_at | timestamptz | Hora de criação do registro |

## Fluxo 2: Geração de Artes

```mermaid
sequenceDiagram
    participant U as Usuário
    participant App as TanStack Start
    participant AI as Provedor de IA
    participant Stor as Supabase Storage
    participant DB as Supabase Postgres

    U->>App: Solicitar geração de arte
    App->>DB: SELECT analysis (imagem de referência)
    App->>AI: Gerar imagem (DALL-E 3/Flux/Imagen 3)
    AI-->>App: Dados de imagem b64_json
    App->>Stor: Upload para generated-arts/{uuid}.jpg
    Stor-->>App: Caminho da imagem
    App->>Stor: Criar URL assinada (30 dias)
    Stor-->>App: URL assinada
    App->>DB: UPDATE analysis.image_gallery
    App->>DB: INSERT ai_usage_logs (custo: R$0,15)
    App-->>U: Exibir arte gerada
```

## Fluxo 3: Gestão IAM

```mermaid
sequenceDiagram
    participant A as Admin
    participant App as TanStack Start
    participant DB as Supabase Postgres

    A->>App: Gerenciar grupos/usuários/tokens
    App->>DB: CRUD iam_groups / iam_users / iam_api_tokens
    DB-->>App: Registros atualizados
    App-->>A: Confirmação + visão atualizada
```

## Fluxo 4: Moderação de Artes

```mermaid
sequenceDiagram
    participant C as Consumidor
    participant A as Analista
    participant App as TanStack Start
    participant DB as Supabase Postgres

    C->>App: Submeter arte (ConsumerSubmissionModal)
    App->>DB: INSERT art_submissions (status: pending)
    A->>App: Visualizar fila de aprovação
    App->>DB: SELECT art_submissions (pending)
    A->>App: Aprovar/Rejeitar
    App->>DB: UPDATE art_submissions (status: approved/rejected)
```

## Fluxo 5: Landing Page da Vitrine

```mermaid
sequenceDiagram
    participant V as Visitante
    participant App as TanStack Start
    participant DB as Supabase Postgres

    V->>App: Acessar /anuncio/:id
    App->>DB: SELECT analysis por ID
    DB-->>App: Registro da análise
    App-->>V: Renderizar StoreLandingPage com portfólio
    V->>V: Clicar botão do WhatsApp
```

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](arquitetura.md) |
| Contexto do sistema | [contexto-do-sistema.md](contexto-do-sistema.md) |
| Contratos | [contratos/](contratos/) |