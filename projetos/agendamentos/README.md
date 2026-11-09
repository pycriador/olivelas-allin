# Clinic Harmony

Prompt — Fase 1.0 — Foundation, IAM & Calendar Engine

Projeto

ClinicFlow

Plataforma SaaS Enterprise para gerenciamento inteligente de agendas de clínicas de psicologia, preparada para múltiplas especialidades da saúde.

O objetivo desta primeira fase é criar toda a fundação da aplicação utilizando o Lovable Cloud, com arquitetura escalável, UX moderna, autenticação, RBAC, sincronização futura com Google Calendar e um banco de dados bem estruturado.

Esta fase deve produzir um sistema completamente funcional, ainda sem IA e sem integrações externas completas, mas com toda a infraestrutura pronta para evolução.

Stack

Implementar utilizando:

 Lovable Cloud

 React 19+

 Next.js 16+

 TypeScript

 Tailwind CSS

 shadcn/ui

 Zustand

 TanStack Query

 React Hook Form

 Zod

 React Router (caso necessário)

 Day.js

 Lucide Icons

Arquitetura modular.

Todo código deve ser organizado por domínio.

Nenhuma lógica de negócio deve ficar diretamente nas páginas.

Criar componentes reutilizáveis.

Objetivo

Criar uma plataforma SaaS multiempresa.

Cada clínica possuirá seus próprios dados.

Tudo deve ser preparado para multi-tenant.

Banco de Dados

Utilizar o banco do Lovable Cloud.

Criar todas as tabelas necessárias para suportar futuras evoluções.

Tenant

 id

 nome

 slug

 status

 timezone

 idioma

 logo

 criado_em

Usuários

Campos:

 id

 tenant_id

 nome

 email

 telefone

 foto

 senha

 status

 idioma

 timezone

 ultimo_login

 criado_em

Perfis (RBAC)

Criar desde agora.

Perfis:

Administrador Global

Administrador da Clínica

Recepcionista

Psicólogo

Supervisor

Somente Leitura

Cada perfil deverá possuir permissões independentes.

Preparar estrutura para futuras permissões customizadas.

Profissionais

Tabela separada dos usuários.

Campos

 usuário

 CRP

 especialidade

 cor da agenda

 bio

 duração padrão consulta

 intervalo padrão

 atendimento online

 atendimento presencial

 ativo

Clientes

Criar cadastro completo.

Campos

Nome

Telefone

Email

Nascimento

CPF

Responsável

Observações

Status

Data cadastro

Horários

Criar estrutura para armazenar:

Dia da semana

Hora inicial

Hora final

Intervalo

Grupo de horário

Profissional

Status

Grupos de Horários

Tabela independente.

Exemplo

Integral

Manhã

Tarde

Noite

Plantão

Personalizado

Eventos

Criar tabela.

Campos

Título

Descrição

Data

Hora início

Hora fim

Tipo

Origem

Status

Profissional

Cliente

Cor

Bloqueios

Criar estrutura para:

Férias

Licença

Reunião

Treinamento

Congresso

Folga

Feriado

Bloqueio manual

Tipos de Atendimento

Criar CRUD.

Exemplo

Primeira consulta

Retorno

Casal

Infantil

Online

Presencial

Grupo

Urgência

Cada tipo possui:

nome

cor

duração

ativo

Autenticação

Implementar autenticação completa.

Login

Logout

Recuperação de senha

Troca de senha

Sessão persistente

Proteção de rotas

Layout

Criar layout moderno semelhante a produtos SaaS Enterprise.

Sidebar recolhível.

Header superior.

Breadcrumb.

Busca global.

Perfil do usuário.

Tema Claro.

Tema Escuro.

Tema automático.

Dashboard

Criar dashboard inicial.

Cards:

Clientes

Profissionais

Consultas hoje

Próximas consultas

Eventos

Bloqueios

Criar gráficos mockados.

Utilizar dados reais quando existirem.

Menu

Dashboard

Agenda

Clientes

Profissionais

Eventos

Bloqueios

Tipos Atendimento

Horários

Grupos Horários

Usuários

Configurações

Agenda

Nesta fase não integrar Google.

Criar calendário próprio.

Visualizações

Dia

Semana

Mês

Timeline

Agenda

Eventos coloridos.

Drag and Drop preparado.

Responsivo.

Cadastro de Clientes

CRUD completo.

Busca.

Filtros.

Paginação.

Ordenação.

Validação.

Cadastro de Profissionais

CRUD completo.

Foto.

Especialidade.

Cor da agenda.

Dias trabalhados.

Tipos de atendimento.

Horários

Criar interface visual.

Adicionar horários facilmente.

Copiar horários para outros dias.

Duplicar semana.

Eventos

CRUD completo.

Selecionar profissional.

Selecionar cliente.

Selecionar tipo.

Cor personalizada.

Bloqueios

CRUD.

Selecionar período.

Selecionar profissional.

Selecionar motivo.

Configurações

Empresa

Logo

Idioma

Timezone

Tema

Formato Data

Formato Hora

Internacionalização

Preparar desde agora.

Português

Inglês

Espanhol

Não utilizar textos fixos.

Responsividade

Desktop

Tablet

Mobile

UX

Loading Skeleton.

Empty States.

Tooltips.

Toasts.

Confirmações.

Undo quando possível.

Segurança

RBAC em todas as telas.

Rotas protegidas.

Validação de permissões.

Validação de formulários.

Sanitização de entradas.

Componentização

Criar biblioteca de componentes reutilizáveis.

Inputs.

Calendário.

Cards.

Tabela.

Drawer.

Modal.

Date Picker.

Time Picker.

Color Picker.

Avatar.

Badge.

Estrutura para Google Calendar

Ainda não integrar.

Mas criar estrutura preparada para:

calendar_id

google_user

refresh_token

access_token

expiration

sync_status

last_sync

webhook_id

Tudo deve permanecer desacoplado para futura implementação.

Arquitetura

Utilizar arquitetura baseada em domínios:

agenda/

clientes/

profissionais/

usuarios/

configuracoes/

dashboard/

auth/

shared/

components/

hooks/

services/

stores/

types/

utils/

Qualidade

Utilizar TypeScript fortemente tipado.

Não utilizar any.

Criar interfaces.

Criar validações.

Código limpo.

Componentes pequenos.

Sem duplicação.

Objetivo Final da Sprint

Ao concluir esta fase, o sistema deverá permitir:

 autenticação e gerenciamento de usuários com RBAC;

 criação de múltiplas clínicas (multi-tenant);

 cadastro de clientes, profissionais, tipos de atendimento, horários, grupos de horários, eventos e bloqueios;

 visualização de uma agenda própria da aplicação, pronta para sincronização futura;

 dashboard funcional com indicadores básicos;

 suporte a temas, idiomas e responsividade;

 persistência de dados no Lovable Cloud.

Importante: toda a arquitetura deve ser pensada para as próximas fases, nas quais serão adicionados sincronização bidirecional com Google Calendar, mecanismo inteligente de disponibilidade, integração com Gmail e Google Meet, notificações, automações, IA para sugestão de horários e evolução para uma plataforma completa de gestão clínica, sem necessidade de refatorações estruturais.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://willian-clinicflow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0b220280-6c92-4050-b6fa-12294faf88c4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
