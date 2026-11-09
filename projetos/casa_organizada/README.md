# 🏠 SmartHome Willian — Rotina Inteligente

Aplicação web para gestão de rotina doméstica. Organize tarefas diárias, semanais, ciclos de lavanderia, cuidados com pets e bebês — tudo em um só lugar com autenticação multiusuário e progresso sincronizado.

## Funcionalidades

- **Rotina Matutina / Noturna** — Tarefas fixas de manhã e noite com encadeamento automático entre dias
- **Tarefas Semanais** — Limpeza e organização distribuída pelos dias da semana
- **Ciclo de Lavanderia** — Cronograma semanal de roupas por categoria (roupas gerais, toalhas, cama, delicadas, pets)
- **Módulo Pets** — Tarefas diárias e semanais para cuidados com cães e/ou gatos (ativável)
- **Módulo Bebê** — Higienização e cuidados extras com bebê (ativável)
- **Progresso Diário** — Barra de progresso e contagem de sequência (streak)
- **Tarefas Personalizadas** — Adicione, edite e remova tarefas livremente
- **Autenticação** — Login/registro via e-mail com Supabase Auth
- **Controle de Acesso** — Papéis: admin, editor, viewer (com gestão de usuários para admin)
- **Editor Global de Tarefas** — Usuários com permissão de edição podem gerenciar tarefas padrão para todos
- **Admin** — Gerenciamento de usuários (bloquear, alterar papel, excluir)
- **Exportar / Importar** — Backup e restauro dos dados em JSON
- **Responsivo** — Interface adaptada para mobile com navegação inferior

## Tecnologias

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI
- **Design:** Interface enterprise com tipografia Inter + Plus Jakarta Sans, tema claro/escuro refinado, glassmorphism, gradientes sutis e animações fluidas
- **Roteamento:** React Router DOM v6
- **Estado & Dados:** TanStack React Query, localStorage, Supabase
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **Testes:** Vitest, Testing Library
- **Gráficos:** Recharts
- **Formulários:** React Hook Form + Zod

## Pré-requisitos

- Node.js 18+ e npm
- Conta no [Supabase](https://supabase.com) com projeto configurado

## Configuração

```bash
# Clone o repositório
git clone https://github.com/pycriador-org/smarthome-willian.git
cd smarthome-willian

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Edite o arquivo .env com as credenciais do seu Supabase:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PUBLISHABLE_KEY
#   VITE_SUPABASE_PROJECT_ID

# Inicie o servidor de desenvolvimento
npm run dev
```

### Supabase

As migrations estão em `supabase/migrations/`. Execute-as no seu projeto Supabase para criar as tabelas necessárias:

- `profiles` — perfil e configurações do usuário
- `user_roles` — papéis (admin, editor, viewer, moderator, user)
- `global_default_tasks` — tarefas padrão globais
- `custom_tasks` — tarefas personalizadas por usuário
- `task_completions` — registro de conclusão por dia
- `task_overrides` — sobrescritas de tarefas padrão

As Edge Functions utilizadas estão em `supabase/functions/`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa ESLint |
| `npm test` | Executa testes com Vitest |
| `npm run test:watch` | Testes em modo watch |

## Estrutura

```
src/
├── App.tsx              # Rotas e providers
├── components/          # Componentes reutilizáveis
├── data/                # Tarefas padrão e schedules
├── hooks/               # Hooks (useRoutine, useAuth, useUserRole)
├── integrations/        # Conexão Supabase + tipos
├── lib/                 # Utilitários
├── pages/               # Páginas da aplicação
└── types/               # Tipos TypeScript
```

## Licença

MIT
