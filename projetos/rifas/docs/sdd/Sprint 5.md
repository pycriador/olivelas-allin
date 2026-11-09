# Sprint 5 — Configurações da Plataforma, Publicação e Personalização das Campanhas

## Objetivo

Continuar o desenvolvimento da plataforma **RaffleHub**.

Esta Sprint tem como objetivo implementar toda a camada de configurações da plataforma e das campanhas, permitindo que cada campanha seja personalizada, validada e publicada de forma profissional antes da integração dos meios de pagamento.

**NÃO implementar Checkout.**

**NÃO implementar PIX.**

**NÃO implementar Mercado Pago.**

**NÃO implementar PagBank.**

**NÃO implementar InfinityPay.**

**NÃO implementar Webhooks.**

**NÃO implementar Sorteios.**

O foco desta Sprint é tornar a plataforma completamente configurável, preparada para produção e pronta para receber os meios de pagamento na próxima Sprint.

---

# Objetivos

Implementar:

- Configurações Gerais da Plataforma
- Configurações das Campanhas
- Personalização Visual
- Configuração de Compartilhamento
- SEO Completo
- Publicação de Campanhas
- Checklist de Publicação
- Preview da Campanha
- Página Pública Melhorada
- Estatísticas Públicas
- Configuração de Reservas
- Domínio e Slug

---

# Banco de Dados

## platform_settings

Criar tabela

Campos

```text
id

platform_name

platform_logo

favicon

default_language

default_timezone

default_theme

primary_color

secondary_color

footer_text

privacy_policy

terms_of_service

support_email

support_phone

created_at

updated_at
```

---

## campaign_settings

Expandir tabela existente adicionando

```text
show_progress_bar

show_percentage_sold

show_remaining_numbers

show_total_numbers

show_contact_information

show_statistics

show_gallery

show_product_description

show_purchase_counter

show_recent_buyers

show_rules

enable_whatsapp

enable_public_page

enable_seo

enable_share

reservation_timeout_minutes

max_numbers_per_purchase

allow_random_selection

allow_manual_selection

publish_status

theme

primary_color

secondary_color

button_color

font_family

background_image

banner_image

share_image

updated_at
```

---

# Status da Publicação

Criar enum

```text
DRAFT

UNDER_REVIEW

PUBLISHED

PAUSED

FINISHED

ARCHIVED
```

---

# Configurações Gerais

Criar tela

## Configurações da Plataforma

Disponível apenas para

GLOBAL_ADMIN

Permitir configurar

- Nome da Plataforma
- Logo
- Favicon
- Idioma padrão
- Timezone
- Tema padrão
- Cor principal
- Cor secundária
- Texto do rodapé
- Política de Privacidade
- Termos de Uso
- Email de suporte
- Telefone de suporte

Persistir todas as informações.

---

# Configurações da Campanha

Adicionar uma nova aba

```text
Configurações
```

Dividir em seções.

---

## Informações Gerais

Permitir editar

Nome

Descrição

Produto

Valor por número

Datas

Status

Slug

---

## Contato

Campos

```text
Nome do responsável

Telefone

WhatsApp

Email

Horário de atendimento
```

---

## Configuração das Reservas

Permitir configurar

Tempo da reserva

Quantidade máxima por pedido

Seleção aleatória

Seleção manual

Reserva automática

---

## Configuração da Página Pública

Ativar ou desativar

Barra de progresso

Quantidade vendida

Quantidade restante

Quantidade total

Descrição

Galeria

Contato

Compartilhamento

Comentários (preparar arquitetura)

FAQ (preparar arquitetura)

---

## Personalização Visual

Cada campanha poderá possuir identidade própria.

Permitir configurar

Cor principal

Cor secundária

Cor dos botões

Tema Claro

Tema Escuro

Fonte

Imagem de fundo

Banner

Logo da campanha

Imagem de compartilhamento

Preview em tempo real.

---

# SEO

Implementar editor de SEO.

Campos

Meta Title

Meta Description

Keywords

Canonical URL

Open Graph Title

Open Graph Description

Open Graph Image

Twitter Card Title

Twitter Card Description

Twitter Card Image

JSON-LD

Schema.org Product

---

# Open Graph

Gerar automaticamente

```html
<meta property="og:title" />

<meta property="og:description" />

<meta property="og:image" />

<meta property="og:url" />

<meta property="og:type" />
```

Caso exista Share Image

↓

Utilizar Share Image

Caso contrário

↓

Utilizar Cover Image

---

# Compartilhamento

Criar painel

Visualizar como aparecerá

WhatsApp

Facebook

Telegram

LinkedIn

X

Copiar Link

Compartilhar via Web Share API

---

# Slug

Permitir editar manualmente.

Validar duplicidade.

Gerar automaticamente quando vazio.

---

# Página Pública

Melhorar interface.

Adicionar

Galeria

Zoom

Carrossel

Resumo

Contato

WhatsApp

Barra de progresso

Percentual vendido

Quantidade restante

Quantidade vendida

Quantidade total

Data de encerramento

Status da campanha

Responsável

---

# Estatísticas Públicas

Mostrar

```text
75%

Vendida
```

```text
150 / 200
```

```text
50 restantes
```

Atualização em tempo real.

---

# Checklist de Publicação

Antes de publicar

Executar validações.

Exemplo

```text
✔ Nome

✔ Produto

✔ Valor

✔ Capa

✔ Galeria

✔ WhatsApp

✔ Responsável

✔ Numeração

✔ SEO

✔ Compartilhamento

✔ Página Pública
```

Caso algum item esteja pendente

Impedir publicação.

Mostrar exatamente o motivo.

---

# Fluxo de Publicação

Rascunho

↓

Validação

↓

Checklist

↓

Publicar

↓

Página Pública disponível

---

# Preview

Adicionar botão

```text
Visualizar Campanha
```

Abrir exatamente como ficará para o visitante.

Sem publicar.

---

# Dashboard

Adicionar indicadores

Campanhas Publicadas

Campanhas em Rascunho

Campanhas Pausadas

Campanhas Encerradas

Campanhas Arquivadas

Campanhas com Pendências

---

# Auditoria

Registrar

Publicação

Despublicação

Mudança de tema

Mudança de SEO

Mudança de configurações

Mudança de contato

Mudança de compartilhamento

---

# Responsividade

Validar

Desktop

Notebook

Tablet

Mobile

---

# Performance

Lazy Loading

Cache

Memoização

Compressão de imagens

Pré-carregamento da imagem de capa

Otimização da página pública

---

# Componentes

Criar

PlatformSettings

CampaignSettings

ThemeEditor

SeoEditor

PublicationChecklist

PublicationStatus

CampaignPreview

SharePreview

ReservationSettings

PublicStatistics

Todos reutilizáveis.

---

# Segurança

Somente

GLOBAL_ADMIN

poderá

Editar configurações

Publicar

Pausar

Arquivar

Alterar SEO

Alterar tema

Alterar compartilhamento

---

# Qualidade

Seguir

SOLID

DRY

Clean Architecture

Repository Pattern

Service Layer

Nenhum uso de any.

Nenhum componente monolítico.

---

# Refatoração

Revisar toda a arquitetura criada até agora.

Eliminar

Código duplicado

Componentes repetidos

Hooks repetidos

Queries duplicadas

Estados inconsistentes

Melhorar organização onde necessário.

---

# Testes

Validar

Publicação

Checklist

Preview

SEO

Compartilhamento

Responsividade

Persistência

Realtime

Permissões

Auditoria

---

# Não implementar

Não iniciar Checkout.

Não iniciar PIX.

Não iniciar Mercado Pago.

Não iniciar PagBank.

Não iniciar InfinityPay.

Não iniciar Webhooks.

Não iniciar Sorteio.

Não iniciar Relatórios Financeiros.

---

# Preparação para Sprint 6

Toda a arquitetura deverá estar preparada para que o botão

```text
Comprar Agora
```

substitua automaticamente o fluxo atual de WhatsApp pelo fluxo de Checkout quando a campanha estiver configurada com:

```text
Purchase Mode = AUTOMATIC
```

Sem necessidade de alterar componentes existentes.

---

# Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

- As configurações globais da plataforma estiverem totalmente funcionais.
- Cada campanha puder possuir configurações independentes.
- A personalização visual funcionar corretamente.
- O SEO estiver completamente configurável.
- Os metadados Open Graph e Twitter Card utilizarem corretamente a imagem de compartilhamento ou, na ausência dela, a imagem de capa.
- A página pública refletir todas as configurações da campanha.
- O checklist impedir a publicação de campanhas incompletas.
- O preview representar fielmente a página pública antes da publicação.
- Todas as alterações forem registradas na auditoria.
- O sistema estiver responsivo, performático e sem erros de TypeScript, ESLint ou warnings críticos.
- A arquitetura estiver preparada para iniciar a Sprint 6 (Checkout e Gateways de Pagamento) sem necessidade de refatorações estruturais.

---

# Melhoria Arquitetural Obrigatória

Antes de finalizar esta Sprint, revisar toda a estrutura criada nas Sprints 1 a 5.

O objetivo é:

- Padronizar nomenclaturas.
- Consolidar componentes reutilizáveis.
- Revisar hooks e services.
- Validar índices e constraints do banco.
- Revisar políticas RLS.
- Eliminar código morto.
- Melhorar mensagens de erro.
- Melhorar UX dos formulários.
- Garantir consistência entre campanhas, pedidos, clientes, reservas e números.

**Nenhuma funcionalidade existente pode ser removida ou sofrer regressão durante esta revisão.**
