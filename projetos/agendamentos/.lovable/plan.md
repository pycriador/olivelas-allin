# ClinicFlow — Fase 1.0 (Foundation, IAM & Calendar Engine)

Escopo enorme. Vou entregar em fases dentro desta sprint, começando pela fundação que destrava todo o resto. Antes disso, alguns ajustes importantes de escopo:

## Ajustes de stack (importante ler)

O template Lovable **não usa Next.js**. Ele é **TanStack Start + React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui**, rodando em Cloudflare Workers com Lovable Cloud (Supabase gerenciado) como backend. Isso é equivalente em capacidade ao que você pediu (SSR, rotas, server functions, RBAC, multi-tenant) e é o caminho suportado. Vou usar:

- TanStack Start / TanStack Router (em vez de Next.js)
- TanStack Query, Zustand, React Hook Form, Zod, Day.js, Lucide — como pedido
- Lovable Cloud (Postgres + Auth + Storage + Edge)
- shadcn/ui + Tailwind v4 com design tokens semânticos
- i18n com `i18next` (pt-BR default, en, es)

Se você exigir Next.js literalmente, precisamos parar aqui — não é suportado neste ambiente.

## Estratégia de entrega

Fase 1.0 tem escopo de várias sprints. Proponho quebrar em **4 sub-entregas sequenciais**, cada uma funcional e testável. Este plano cobre a **Sub-entrega 1 (Foundation)**. Ao final dela eu proponho a Sub-entrega 2, e assim por diante.

### Sub-entrega 1 — Foundation (esta) 
Base multi-tenant + Auth + RBAC + Schema completo + Layout + Dashboard mockado.

### Sub-entrega 2 — Cadastros
CRUDs: Clientes, Profissionais, Tipos de Atendimento, Grupos de Horários, Horários.

### Sub-entrega 3 — Agenda Engine
Calendário próprio (Dia/Semana/Mês/Timeline), Eventos CRUD, Bloqueios, drag-and-drop.

### Sub-entrega 4 — Configurações, i18n completo, refinamento UX
Configurações da clínica, temas, i18n em todas as telas, empty states, skeletons, tabela pronta para Google Calendar.

---

## O que entrego na Sub-entrega 1

### Backend (Lovable Cloud)
Habilitar Cloud e criar migração com **schema completo de todas as tabelas** já pensadas para as próximas fases (mesmo as que só serão usadas na Sub-entrega 2/3), com RLS multi-tenant desde o início:

- `tenants` (clínicas)
- `profiles` (dados do usuário, ligado a `auth.users`, com `tenant_id`)
- `app_role` enum + `user_roles` (RBAC — tabela separada, security definer `has_role`)
- `professionals`
- `clients`
- `appointment_types`
- `schedule_groups`
- `schedules` (horários de trabalho)
- `events` (agenda)
- `blocks` (bloqueios/férias/feriados)
- `google_calendar_connections` (estrutura pronta, sem uso ainda)
- `tenant_settings` (logo, timezone, idioma, formatos)

Todas com RLS por `tenant_id` + helper `current_tenant_id()` + policies por role.
Trigger `handle_new_user` cria `profiles` + role default.

### Frontend

- **Auth completo**: login, signup (cria tenant no primeiro signup), logout, recuperar senha, `/reset-password`, rotas protegidas via `_authenticated` layout gerenciado.
- **Design system**: tokens semânticos em `styles.css` (paleta enterprise, não roxo genérico), tema claro/escuro/auto via `next-themes`.
- **Layout SaaS**: shadcn sidebar recolhível, header com busca global (placeholder), breadcrumb, menu de perfil, troca de tema, troca de idioma.
- **Menu completo** já com todas as rotas (páginas placeholder "Em breve" nas que ainda não têm CRUD — serão preenchidas nas próximas sub-entregas).
- **Dashboard**: cards com contagens reais do tenant (clientes, profissionais, consultas hoje, próximas, eventos, bloqueios) + gráficos mockados (Recharts).
- **i18n scaffold**: `i18next` configurado com pt-BR/en/es, chaves já usadas no layout e dashboard.
- **Arquitetura por domínio**:
  ```
  src/
    domains/{auth,dashboard,agenda,clientes,profissionais,eventos,bloqueios,tipos-atendimento,horarios,grupos-horarios,usuarios,configuracoes}/
      components/  hooks/  services/  stores/  types/
    shared/{components,hooks,lib,i18n,stores}
    routes/  (TanStack file-based, thin — só compõe domínios)
  ```

### Fora desta sub-entrega
CRUDs de negócio, agenda visual, drag-and-drop, configurações da clínica — vêm nas próximas.

---

## Confirmar antes de começar

1. **Stack**: OK usar TanStack Start em vez de Next.js? (é o único suportado aqui)
2. **Multi-tenant signup**: primeiro usuário cria a clínica automaticamente (nome = pedido no cadastro), vira Admin da Clínica. OK?
3. **Idioma default**: pt-BR. OK?

Se OK nos três, eu já habilito Cloud e começo pela Sub-entrega 1.