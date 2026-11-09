Sprint 3 — Campaign Management Platform
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Nesta Sprint implementar o módulo completo de gerenciamento de campanhas.

NÃO implementar checkout.

NÃO implementar pagamentos.

NÃO implementar reserva de números.

NÃO implementar sorteio.

O objetivo é entregar um módulo de campanhas totalmente funcional e preparado para integração com os próximos módulos.

Objetivos da Sprint

Implementar:

CRUD de campanhas
Cadastro do produto
Galeria de imagens
Capa da campanha
Compartilhamento
Página pública
SEO
Configurações da campanha
Dashboard das campanhas
Persistência completa no Lovable Cloud
Banco de Dados

Criar as tabelas abaixo.

campaigns

Campos

id (UUID)

slug (único)

title

short_description

description

product_name

product_description

number_start

number_end

total_numbers

price_per_number

cover_image

status

visibility

start_date

end_date

allow_random_selection

reservation_timeout_minutes

max_numbers_per_purchase

created_by

created_at

updated_at

deleted_at
campaign_images

Campos

id

campaign_id

filename

storage_path

display_order

is_cover

created_at
campaign_settings

Campos

id

campaign_id

show_progress

show_remaining_numbers

show_product_value

enable_share

enable_seo

enable_public_page

created_at
Status da Campanha

Implementar estados:

DRAFT

SCHEDULED

ACTIVE

PAUSED

FINISHED

CANCELLED

ARCHIVED

Permitir transições válidas entre estados.

CRUD de Campanhas

Criar interface administrativa moderna.

Campos obrigatórios:

Nome da campanha
Nome do produto
Descrição curta
Descrição completa (editor Rich Text/Markdown)
Número inicial
Número final
Valor por número
Data de início
Data de encerramento
Limite de números por compra
Tempo de reserva (configurável)
Visibilidade (Pública/Privada)

Permitir:

Criar
Editar
Duplicar
Arquivar
Excluir (Soft Delete)
Restaurar
Pesquisar
Filtrar
Ordenar
Paginar
Slug Automático

Gerar automaticamente.

Exemplo:

iPhone 17 Pro

↓

iphone-17-pro

Caso exista:

iphone-17-pro-2
Validações

Impedir:

valor negativo
intervalo inválido
data final menor que inicial
slug duplicado
quantidade de números menor que 1
Galeria de Imagens

Integrar com Lovable Storage.

Permitir:

Upload múltiplo
Drag and Drop
Preview
Reordenar
Excluir
Definir imagem de capa
Compressão automática
Lazy Loading

Pastas

campaigns/

{campaign_id}/

cover/

gallery/
Imagem de Capa

Sempre existir uma.

Caso seja excluída

↓

Selecionar automaticamente outra.

Página Pública

Criar rota

/r/{slug}

Interface moderna.

Conteúdo:

Imagem principal

Galeria

Nome

Descrição

Produto

Valor por número

Quantidade total

Período da campanha

Status

Botões

Compartilhar

Comprar (placeholder)

Compartilhamento

Implementar:

WhatsApp

Facebook

Telegram

X

Copiar Link

Compartilhar nativo (Web Share API quando suportado)

Open Graph

Gerar automaticamente.

Campos

Título

Descrição

Imagem de capa

URL

Twitter Card

Schema.org Product

Canonical

SEO

Criar:

Meta Title

Meta Description

Keywords

robots.txt

sitemap

URLs amigáveis

JSON-LD

Dashboard

Criar dashboard das campanhas.

Cards

Total de campanhas

Ativas

Agendadas

Finalizadas

Canceladas

Arquivadas

Última criada

Criar gráfico

Campanhas por mês.

Pesquisa

Pesquisar por:

Nome

Produto

Slug

Status

Administrador

Filtros

Status

Data

Administrador

Visibilidade

Página de Detalhes

Criar página exclusiva.

Exibir:

Todas as informações

Galeria

Histórico

Configurações

Resumo

Botão Editar

Botão Compartilhar

Botão Publicar

Configurações da Campanha

Criar painel lateral.

Permitir:

Mostrar progresso

Mostrar quantidade restante

Mostrar preço

Mostrar descrição

Permitir compartilhamento

Página pública ativa

SEO ativo

Selecionar imagem de compartilhamento

Histórico

Registrar:

Criação

Edição

Mudança de status

Upload

Exclusão

Duplicação

Arquivamento

Utilizar tabela de auditoria criada anteriormente.

Storage

Implementar limpeza automática.

Quando excluir campanha

↓

Excluir imagens órfãs.

Responsividade

Validar

Desktop

Notebook

Tablet

Mobile

Galeria adaptativa.

Componentes Novos

Criar

CampaignCard

CampaignTable

CampaignGallery

CampaignPreview

CampaignStatusBadge

CampaignWizard

CampaignSettings

ImageSorter

ShareDialog

SEOEditor

Todos reutilizáveis.

Segurança

Somente GLOBAL_ADMIN poderá

Criar

Editar

Excluir

Arquivar

Publicar

Duplicar campanhas.

Usuários comuns

Apenas poderão visualizar páginas públicas.

Performance

Utilizar

Lazy Loading

Infinite Scroll na galeria

Compressão de imagens

Memoização

TanStack Query

Cache inteligente

Qualidade

Seguir

SOLID

DRY

Clean Architecture

Zero uso de any.

Nenhum componente monolítico.

Não implementar nesta Sprint

Não criar grade dos números.

Não reservar números.

Não realizar pagamentos.

Não integrar PIX.

Não implementar checkout.

Não realizar sorteio.

Os botões "Comprar" devem existir, mas direcionar para uma tela "Em desenvolvimento" ou permanecer desabilitados.

Critérios de Aceitação (Definition of Done)

A Sprint será considerada concluída somente quando:

CRUD completo de campanhas funcional.
Upload de imagens integrado ao Lovable Storage.
Galeria com ordenação, exclusão e definição de capa.
Página pública acessível por slug.
Compartilhamento gerando preview com Open Graph corretamente.
SEO básico configurado.
Dashboard administrativo funcionando.
Auditoria registrando todas as operações.
Soft Delete implementado.
RLS protegendo todas as tabelas.
Interface totalmente responsiva.
Sem erros de TypeScript, ESLint ou warnings críticos.
Observação arquitetural

Embora você tenha citado um exemplo de 0 a 200, eu sugiro que a plataforma seja totalmente flexível: permitir qualquer intervalo (0–200, 1–1000, 10000–19999, etc.). Internamente, a grade de números deve ser derivada de number_start e number_end, em vez de armazenar apenas uma quantidade fixa. Isso facilita campanhas personalizadas e evita limitações futuras.
