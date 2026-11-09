Sprint 2 — Core Platform & Administration
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

NÃO implementar o módulo de rifas.

NÃO implementar checkout.

NÃO implementar pagamentos.

O objetivo desta Sprint é construir toda a infraestrutura administrativa da plataforma, tornando-a preparada para crescimento sem refatorações estruturais.

Toda implementação deve utilizar a arquitetura criada na Sprint 1.

Stack

Manter exatamente a stack utilizada anteriormente.

React 19
TypeScript
Vite
TanStack Router
TanStack Query
TailwindCSS v4
shadcn/ui
Radix UI
Framer Motion
React Hook Form
Zod
Lovable Cloud
PostgreSQL
Authentication
Storage
Edge Functions
Row Level Security

Não alterar a arquitetura existente.

Objetivos da Sprint

Implementar os módulos:

Administração de Usuários
Configurações Globais
Gerenciamento de Arquivos
Auditoria
Sistema de Permissões
Sistema de Configurações
Navegação Completa
Estrutura para futuras integrações

Toda lógica deve utilizar o banco de dados do Lovable Cloud.

Módulo de Usuários

Criar CRUD completo.

Campos

Nome
Email
Avatar
Status
Papel
Data de criação
Último login

Papéis

GLOBAL_ADMIN

USER

Status

ACTIVE

DISABLED

Permitir

Editar usuário
Desativar usuário
Reativar usuário
Excluir usuário (soft delete)
Pesquisar
Filtrar
Ordenar
Paginação

Criar tabela moderna.

Utilizar DataTable reutilizável.

Regras

Somente GLOBAL_ADMIN pode

Editar usuários

Excluir usuários

Alterar papéis

Alterar status

Visualizar todos

Usuário comum

Visualiza apenas seu próprio perfil.

Banco

Criar tabelas

profiles

Caso ainda não exista.

audit_logs

Campos

id

user_id

action

entity

entity_id

old_value

new_value

ip

user_agent

created_at
settings

Campos

id

category

key

value

description

created_at

updated_at
storage_files

Campos

id

filename

path

mime_type

size

uploaded_by

created_at
Auditoria

Registrar automaticamente

Login

Logout

Criação

Edição

Exclusão

Alteração de status

Upload

Download

Erros críticos

Cada evento deve gerar um registro.

Criar tela de consulta.

Filtros

Usuário

Período

Ação

Pesquisa

Paginação

Configurações

Criar módulo completo.

Categorias

Sistema

Interface

Segurança

Pagamentos

Compartilhamento

Uploads

Notificações

Cada categoria deve possuir

Cards

Descrição

Formulários

Validação

Persistência

Tema

Permitir alterar

Tema padrão

Idioma padrão

Nome da plataforma

Logo

Favicon

Cor principal

Cor secundária

As configurações deverão ficar persistidas.

Storage

Criar integração completa.

Uploads

Excluir arquivos

Visualizar

Pesquisar

Filtros

Organização

uploads/

avatars/

campaigns/

documents/

temp/

Criar componente reutilizável.

Upload Drag-and-Drop.

Upload múltiplo.

Preview.

Barra de progresso.

Avatar

Usuário poderá

Enviar

Trocar

Excluir

Avatar.

Salvar no Storage.

Sidebar

Agora implementar

Dashboard

Usuários

Arquivos

Auditoria

Configurações

Perfil

Campanhas (placeholder)

Pagamentos (placeholder)

Relatórios (placeholder)

Dashboard

Substituir mocks por consultas reais quando possível.

Criar

Resumo

Usuários ativos

Usuários desativados

Arquivos enviados

Logs do dia

Últimos logins

Atividades recentes

Gráfico de crescimento

Busca Global

Criar Search Bar.

Preparar arquitetura para pesquisar futuramente

Campanhas

Usuários

Pagamentos

Arquivos

Nesta Sprint retornar apenas usuários e arquivos.

Sistema de Permissões

Criar middleware.

Hooks

Helpers

Components

Exemplo

<Can permission="users.edit">

Criar arquitetura preparada para futuras permissões.

Mesmo existindo apenas dois papéis.

RLS

Revisar todas as tabelas.

Criar políticas completas.

Nenhum usuário poderá acessar dados que não lhe pertençam.

GLOBAL_ADMIN possui acesso administrativo.

Edge Functions

Criar estrutura para

Auditoria

Uploads

Configurações

Futuras integrações

Não implementar integrações externas.

Componentes novos

Criar

DataTable

SearchInput

FileUploader

ImagePreview

AvatarUploader

ConfirmDelete

ActivityTimeline

AuditTable

SettingsCard

PermissionGuard

Todos reutilizáveis.

UX

Adicionar

Skeletons

Loading States

Error States

Success Feedback

Dialogs

Confirmações

Nenhuma ação destrutiva poderá ocorrer sem confirmação.

Responsividade

Validar

Desktop

Notebook

Tablet

Mobile

Sidebar responsiva.

Segurança

Validar

Uploads

Tipos permitidos

Limite de tamanho

Sanitização

Sessões

Proteção de rotas

Soft Delete

Auditoria obrigatória

Código

Continuar seguindo

SOLID

Clean Architecture

DRY

KISS

Componentização

Zero uso de any.

Nenhum componente com responsabilidades excessivas.

Preparação para as próximas Sprints

Toda a arquitetura deverá estar preparada para receber:

Campanhas
Galeria de imagens
Numeração das rifas
Checkout
PIX
Mercado Pago
PagBank
InfinityPay
Compartilhamento
Dashboard Financeiro
Sorteios
Relatórios

Esses módulos não devem ser implementados nesta Sprint, apenas a infraestrutura necessária para integrá-los futuramente.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

Todo o módulo administrativo estiver funcional.
CRUD de usuários completo e integrado ao Lovable Cloud.
Apenas GLOBAL_ADMIN puder administrar usuários.
Sistema de configurações persistido no banco.
Uploads funcionando com Lovable Storage.
Avatares armazenados e gerenciados corretamente.
Auditoria registrando automaticamente todas as ações relevantes.
Todas as tabelas protegidas por RLS.
Interface totalmente responsiva.
Componentes reutilizáveis documentados e organizados.
Não existirem erros de TypeScript, ESLint ou warnings críticos.
A plataforma permanecer preparada para evolução incremental, sem necessidade de reestruturação arquitetural.
Próxima sequência recomendada

A partir daqui, eu seguiria a seguinte ordem:

Sprint 3 — Módulo de Campanhas (CRUD completo das rifas, produtos, galeria de imagens, configurações e links públicos).
Sprint 4 — Seleção de números, reservas temporárias e atualização em tempo real.
Sprint 5 — Checkout, PIX, webhooks e integração com gateways de pagamento.
Sprint 6 — Painel financeiro, sorteios, relatórios e compartilhamento social com Open Graph.

Essa ordem tende a reduzir dependências cruzadas e facilita validar cada etapa antes de avançar para a seguinte.
