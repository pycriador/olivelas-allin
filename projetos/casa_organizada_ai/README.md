<div align="center">
  <br/>
  <h1>🏠 HomeFlow AI</h1>
  <p><strong>Organize toda sua vida em um único lugar</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TanStack_Start-1.168-FF4154?logo=tanstack" alt="TanStack Start" />
    <img src="https://img.shields.io/badge/Supabase-2.110-3FCF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  </p>
  <br/>
</div>

## 📋 Sobre

**HomeFlow AI** é uma aplicação web full-stack SaaS para organização pessoal e familiar. Permite criar rotinas, checklists, planejamentos e formulários personalizados — tudo com construtor drag-and-drop, assistência de IA, temas customizáveis e um marketplace de templates e temas.

> **Status:** Em desenvolvimento ativo (Sprint 1)

## ✨ Funcionalidades

### 📝 Construtor de Formulários
- Criador de formulários drag-and-drop com preview ao vivo
- 16+ tipos de campos: texto, número, data, checkbox, select, rádio, heading, divider, spacer, etc.
- Formulários multi-página com gerenciamento de páginas
- Undo/redo com Zundo (Zustand middleware)
- Salvamento automático (autosave)
- Versionamento de formulários

### 🖨️ Print Studio / PDF
- Visualização WYSIWYG em formatos A4, A5 e Carta
- Orientação retrato/paisagem, margens configuráveis
- Cabeçalho e rodapé com placeholders
- Página de capa
- Geração de PDF (pdf-lib + html2canvas)
- Impressão direta no navegador
- Salvamento de layouts de impressão

### 🤖 Assistente IA
- Chat conversacional multi-thread
- Modelos disponíveis: Gemini 2.5 Flash/Pro, GPT-5 Mini/Pro
- Configurações por usuário (modelo, temperatura, system prompt, idioma)
- Títulos automáticos de conversas
- Persistência de histórico
- Prompt especializado em organização pessoal e familiar

### 🏪 Marketplace
- Templates e temas criados pela comunidade
- Busca, filtros por categoria/idioma
- Ordenação por popularidade, recentes, avaliações, downloads
- Favoritar templates e temas
- Categorias: Casa, Pets, Crianças, Limpeza, Academia, Estudos, Medicamentos, Compras, Viagens, Jardinagem, Idosos, Projetos, Empresa, Pessoal

### 🎨 Tema Customizável
- Personalização de cores, fontes, logotipo e layout
- Modo claro/escuro/automático com detecção do sistema
- Temas criados por usuários aplicados em toda a app
- Sistema de design com espaço de cores OKLCH

### 👤 Autenticação e Perfis
- Login/registro com email e senha via Supabase Auth
- Controle de acesso baseado em funções (admin/usuário)
- Perfil de usuário com preferências

### 🛠️ Administração
- Painel exclusivo para administradores globais
- Log de auditoria com ações do usuário

## 🚀 Tecnologias

### Frontend
| Categoria | Tecnologias |
|---|---|
| **Framework** | React 19.2, TanStack Start 1.168 (SSR), Vite 8 |
| **Linguagem** | TypeScript 5.8 (strict) |
| **Roteamento** | TanStack Router 1.170 (file-based) |
| **Estado** | Zustand + Zundo (undo/redo), TanStack Query 5.101 |
| **UI** | shadcn/ui + Radix UI, Tailwind CSS v4, tw-animate-css |
| **Formulários** | react-hook-form + Zod |
| **Ícones** | Lucide React |
| **Gráficos** | Recharts |
| **Animação** | Motion v12 |
| **Drag & Drop** | @dnd-kit |

### Backend / Infraestrutura
| Categoria | Tecnologias |
|---|---|
| **Database** | Supabase (PostgreSQL) com Row-Level Security |
| **ORM** | @supabase/supabase-js com tipos do banco |
| **Autenticação** | Supabase Auth (email/senha) |
| **AI/LLM** | Vercel AI SDK 7 + Lovable AI Gateway |
| **PDF** | pdf-lib + html2canvas |
| **Server Engine** | Nitro 3.0 (beta) |
| **Cloud** | Lovable Cloud |

### Ferramentas
| Categoria | Tecnologias |
|---|---|
| **Package Manager** | bun ou npm |
| **Linting** | ESLint 9 + typescript-eslint |
| **Formatação** | Prettier |

## 📁 Estrutura do Projeto

```
src/
├── components/         # Componentes compartilhados
│   ├── ai-elements/    # UI do chat IA
│   ├── app/            # Sidebar e navegação do app
│   ├── ui/             # shadcn/ui components
│   ├── logo.tsx
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   └── theme-toggle.tsx
├── hooks/              # Hooks personalizados
├── integrations/       # Integrações (Supabase, Lovable)
│   └── supabase/
│       ├── client.ts       # Cliente browser
│       ├── client.server.ts # Cliente server-side
│       ├── auth-middleware.ts
│       └── types.ts        # Tipos do banco de dados
├── lib/                # Utilitários e configurações
├── modules/            # Módulos funcionais
│   ├── ai/             # Chat IA e configurações
│   ├── form-builder/   # Construtor de formulários
│   ├── form-fields/    # Registro de tipos de campo
│   ├── marketplace/    # Marketplace de templates
│   ├── pdf/            # Geração de PDF e Print Studio
│   └── preview/        # Preview de formulários
├── routes/             # Rotas (file-based)
│   ├── __root.tsx      # Layout raiz
│   ├── index.tsx       # Landing page
│   ├── auth.tsx        # Login/registro
│   ├── _authenticated/ # Rotas protegidas
│   │   └── app.*.tsx   # Dashboard, formulários, marketplace, etc.
│   └── api/            # Endpoints de API
├── styles.css          # Tailwind + design system
├── router.tsx          # Configuração do router
├── server.ts           # Entry point SSR
└── start.ts            # Instância TanStack Start

supabase/
├── config.toml         # Configuração do projeto Supabase
└── migrations/         # Migrations do banco de dados
```

## 🛠️ Pré-requisitos

- **Node.js** 20+
- **bun** ou **npm**
- Conta no **Supabase** (para banco de dados e autenticação)

## ⚙️ Configuração

1. Clone o repositório:
   ```bash
   git clone https://github.com/pycriador-org/homeflowai-willian.git
   cd homeflowai-willian
   ```

2. Instale as dependências:
   ```bash
   bun install
   # ou
   npm install
   ```

3. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=seu_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon
   ```

4. Execute as migrations do Supabase:
   ```bash
   # Faça login no Supabase CLI e aplique as migrations
   supabase migration up
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   bun run dev
   # ou
   npm run dev
   ```

## 📜 Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build em modo desenvolvimento |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa ESLint |
| `npm run format` | Formata código com Prettier |

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: Minha nova feature'`
4. Push: `git push origin minha-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com ❤️ usando <a href="https://lovable.dev">Lovable</a></p>
  <p>
    <a href="https://github.com/pycriador-org/homeflowai-willian">GitHub</a>
  </p>
</div>
