# Plataforma Odontológica & Gestão de Consultório — Sistema de Agendamentos & Clínica

[![Status](https://img.shields.io/badge/Status-Produção%20%7C%20Supabase%20Ativo-success?style=for-the-badge&logo=supabase&color=059669)](https://github.com/pycriador/consultorio-agendamento)
[![Tecnologias](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20%7C%20PostgreSQL-blue?style=for-the-badge&logo=javascript&color=0f172a)](https://github.com/pycriador/consultorio-agendamento)
[![Segurança](https://img.shields.io/badge/Auth-Senhas%20Criptografadas%20(bcrypt)-purple?style=for-the-badge&logo=auth0&color=7c3aed)](https://github.com/pycriador/consultorio-agendamento)
[![Responsivo](https://img.shields.io/badge/Mobile-First-100%25%20Responsivo-brightgreen?style=for-the-badge)](https://github.com/pycriador/consultorio-agendamento)

Solução digital completa para consultórios e clínicas odontológicas. O projeto une uma **Landing Page pública de alta conversão** a um **Sistema Integrado de Gestão Clínica (Painel Administrativo)**, com suporte a banco de dados em nuvem **PostgreSQL via Supabase**, autenticação segura com senhas criptografadas, agendamento online e sincronização dinâmica em tempo real.

---

## 🌟 Principais Destaques & Funcionalidades Recentes

### 1. 🔄 Sincronização Dinâmica & Recompilação da Landing Page
Qualquer alteração realizada no painel administrativo reflete diretamente na Landing Page (`index.html`) e nas páginas públicas (`pages/servicos.html` e `pages/contato.html`):
- **Catálogo de Serviços (`pages/servicos-admin.html`):** Adição, edição, alteração de valores/duração ou inativação de procedimentos atualizam automaticamente os cards da seção `#tratamentos`, vinculando os ícones correspondentes e botões de agendamento.
- **Planos & Combos (`pages/planos.html`):** Criação de planos de acompanhamento, pacotes preventivos e definições de destaque (*"Mais Procurado"*) sincronizam em tempo real na seção `#planos`.
- **Grade de Horários (`pages/horarios.html`):** O expediente semanal configurado atualiza dinamicamente o rodapé da Landing Page e a seção de horários na página de contato.
- **Recompilação Estática (`scripts/sync-landing.js`):** Script executável via Node.js (`node scripts/sync-landing.js`) para recompilar o HTML estático pré-renderizado diretamente nos arquivos `.html`, garantindo excelente indexação (SEO) e performance instantânea.

### 2. 🗄️ Backend Supabase (PostgreSQL) & Autenticação Criptografada
- **Banco de Dados Relacional:** Substituição integral dos dados simulados por tabelas persistentes no Supabase (`patients`, `appointments`, `services`, `plans`, `clinic_settings`, `messages`, `audit_logs`).
- **Autenticação com Criptografia:** Login seguro com hash bcrypt no Supabase Auth e proteção de rotas com `AuthGuard` client-side.
- **CRUDs Completos:** Todas as telas de listagem (Pacientes, Agendamentos, Serviços, Planos, Horários) realizam operações completas de criação, leitura, atualização e exclusão com persistência no banco.
- **Resiliência e Cache:** Camada unificada `DatabaseService` com sincronização automática e fallback seguro no storage local.

### 3. 🎯 Interface Otimizada & Menus Dropdown Unificados
- **Ações de Pacientes (`pages/pacientes.html`):** Substituição de botões pequenos dispersos por um menu dropdown flutuante unificado por cliente (Ver Prontuário, Editar Cadastro, Alternar Status e Excluir Paciente).
- **Ações de Agendamentos (`pages/agendamentos.html`):** Menu dropdown elegante com opções de Abrir Agenda do Dia, Enviar Lembrete por WhatsApp, Editar Agendamento, Alternar Status e Cancelar/Excluir Consulta.
- **Exclusão de Consulta na Visão Diária da Agenda (`pages/agenda.html`):** Possibilidade de inspecionar o dia da agenda e excluir consultas diretamente no calendário e no banco de dados.
- **Navegação Mobile Clean:** Menus superiores limpos com drawer lateral deslizante (menu hambúrguer) tanto na Landing Page pública quanto na área administrativa.

---

## 🗺️ Estrutura & Navegação da Aplicação

### 1. Área Pública (Landing Page & Portais do Paciente)
- **Home / Landing Page (`index.html`):**
  - **Hero Section:** Slogan de acolhimento, selo de convênios atendidos, agendamento rápido e botão direto para WhatsApp.
  - **Sobre a Clínica:** Apresentação humanizada dos valores de biossegurança, tecnologia e atendimento humanizado (sem medo e sem dor).
  - **Tratamentos & Especialidades:** Cards dinâmicos com ícones dedicados (*Clínica Geral*, *Limpeza Dental*, *Aparelho Ortodôntico*, *Implantes Dentários*, etc.).
  - **Diferenciais da Clínica:** Biossegurança de padrão hospitalar, pontualidade britânica, tecnologia e aceitação de múltiplos convênios.
  - **Planos & Avaliações:** Catálogo com valores e procedimentos transparentes.
  - **Perguntas Frequentes (FAQ):** Accordion com dúvidas comuns de novos pacientes.
  - **Footer Dinâmico:** Links rápidos, expediente sincronizado com o painel e canais de contato.
- **Páginas Específicas de Especialidades:**
  - [`pages/clinica-geral.html`](pages/clinica-geral.html): Restaurações, diagnóstico e acompanhamento integral.
  - [`pages/limpeza.html`](pages/limpeza.html): Profilaxia profunda, raspagem e prevenção periodontal.
  - [`pages/aparelho-ortodontico.html`](pages/aparelho-ortodontico.html): Aparelhos fixos estéticos, metálicos e alinhadores transparentes.
  - [`pages/implantes.html`](pages/implantes.html): Reabilitação protética sobre implantes de titânio.
- **Agendamento Público Online (`pages/agendar.html`):** Fluxo intuitivo em etapas onde o paciente seleciona especialidade, data, horário disponível e preenche seus dados com validação imediata.
- **Canal de Atendimento (`pages/contato.html`):** Informações de endereço, WhatsApp direto, grade de funcionamento sincronizada e formulário de contato.

### 2. Área Administrativa (Sistema de Gestão Clínica)
- **Autenticação Segura (`login.html`):** Tela de login com validação de credenciais criptografadas via Supabase Auth e sessão gerenciada por token.
- **Dashboard Executivo (`pages/dashboard.html`):** Indicadores-chave em tempo real (consultas do dia, pacientes ativos, confirmações pendentes e atalhos operacionais rápidos).
- **Agenda Interativa (`pages/agenda.html`):** Calendário com visão semanal, mensal e diária, slots codificados por procedimento, reagendamento e exclusão de agendamentos no dia.
- **Gestão de Agendamentos (`pages/agendamentos.html`):** Tabela completa com filtros por status (*Confirmado*, *Pendente*, *Realizado*, *Cancelado*), busca textual e menu dropdown flutuante para ações rápidas.
- **Prontuário & Gestão de Pacientes (`pages/pacientes.html` e `pages/paciente-detalhes.html`):**
  - Listagem com foto/avatar, CPF, telefone, última consulta e menu de opções em dropdown compacto.
  - Ficha clínica completa: histórico de consultas, tratamentos realizados, prescrições, anotações de evolução e odontograma interativo.
- **Catálogo de Serviços (`pages/servicos-admin.html`):** Gestão de procedimentos, durações estimadas e faixas de preço, refletidos na Landing Page.
- **Gestão de Planos & Combos (`pages/planos.html`):** Tabela de pacotes, periodicidade, serviços inclusos e badges de destaque na página inicial.
- **Grade de Horários & Expediente (`pages/horarios.html`):** Configuração de turnos de atendimento, intervalos de almoço e bloqueio de folgas.
- **Central de Mensagens (`pages/mensagens.html`):** Templates pré-configurados de confirmação, lembretes de 24h e acompanhamento pós-operatório.
- **Disparo de WhatsApp (`pages/whatsapp.html`):** Envio de lembretes e mensagens personalizadas via integração web.
- **Integração Google Calendar (`pages/google-calendar.html`):** Painel de sincronização de agenda com o Google Calendar.
- **Configurações da Clínica (`pages/configuracoes.html`):** Dados cadastrais, canais de atendimento e personalização do consultório.
- **Perfil do Usuário (`pages/perfil.html`):** Atualização de dados cadastrais, alteração de senha e encerramento de sessão (*logout*).

---

## 💻 Tecnologias Empregadas

```
┌────────────────────────────────────────────────────────┐
│                      FRONT-END                         │
│  HTML5 Semântico • CSS3 Moderno (Custom Properties)    │
│  JavaScript Vanilla (ES6+ Modules, Classes & Async)    │
├────────────────────────────────────────────────────────┤
│                 BANCO DE DADOS & AUTH                  │
│  Supabase (PostgreSQL 15+ em nuvem)                    │
│  Supabase Auth (Criptografia bcrypt e JWT)             │
│  Row Level Security (RLS) & Triggers                   │
├────────────────────────────────────────────────────────┤
│                  DESIGN & ASSETS                       │
│  Google Fonts (Playfair Display, Dancing Script, Inter)│
│  Ícones e Logotipo em PNG transparente de alta definição│
└────────────────────────────────────────────────────────┘
```

- **CSS Moderno:** CSS Grid, Flexbox, variáveis nativas (`--color-primary`, `--space-4`, etc.), transições fluidas e total responsividade mobile-first.
- **Componentização Acessível:** Modais customizados com foco trap e tecla `Escape`, notificações toast flutuantes e menus dropdown dinâmicos.
- **Zero Dependências Pesadas:** Frontend leve, de carregamento instantâneo e execução imediata em qualquer navegador moderno.

---

## 📁 Estrutura de Arquivos

```text
consultorio-agendamento/
│
├── index.html                   # Landing page institucional principal
├── login.html                   # Tela de login do sistema administrativo
├── README.md                    # Documentação técnica e operacional da plataforma
├── .env.example                 # Exemplo de configuração de variáveis de ambiente
│
├── assets/
│   ├── icons/                   # Ícones das especialidades em PNG transparente
│   │   ├── icone-clinica-geral.png
│   │   ├── icone-limpeza.png
│   │   ├── icone-aparelho-ortodontico.png
│   │   └── icone-implantes.png
│   └── images/                  # Imagens e fotografias institucionais
│       ├── logo.png             # Logotipo com transparência aplicada
│       ├── logo.jpg             # Arte original
│       ├── consultorio.jpg      # Foto de ambientação do consultório
│       └── sorriso-saudavel.jpg # Foto institucional da seção Sobre
│
├── css/
│   ├── variables.css            # Design tokens (cores rosé/bordô, tipografia, sombras)
│   ├── reset.css                # Normalização de estilos cross-browser
│   ├── global.css               # Estilos base, botões, cards e tipografia
│   ├── components.css           # Toasts, modais, badges e menus dropdown
│   ├── landing.css              # Estilos específicos da landing page e seções
│   ├── admin.css                # Layout do painel (sidebar, topbar, cards de métricas)
│   ├── forms.css                # Estilização de inputs, selects e estados de validação
│   ├── calendar.css             # Componente de grade da agenda e visualizações
│   └── responsive.css           # Breakpoints para smartphones, tablets e desktops
│
├── js/
│   ├── app.js                   # Inicializador da aplicação
│   ├── auth.js                  # Gerenciador de autenticação e proteção de rotas (AuthGuard)
│   ├── supabase-client.js       # Inicialização do cliente Supabase via .env / configuração
│   ├── database.js              # Camada unificada de CRUD no Supabase (DatabaseService)
│   ├── landing-sync.js          # Sincronização em tempo real de serviços, planos e horários
│   ├── storage.js               # Gerenciador de persistência e fallback no LocalStorage
│   ├── mock-data.js             # Base inicial e fallback estruturado
│   ├── components.js            # Componentes reutilizáveis (Sidebar, Topbar, etc.)
│   ├── modal.js                 # Gerenciador global de janelas modais
│   ├── toast.js                 # Sistema de notificações flutuantes (Toasts)
│   ├── calendar.js              # Lógica do calendário e renderização de slots
│   ├── appointments.js          # CRUD de agendamentos e controle de status
│   ├── patients.js              # CRUD de pacientes e visualização de prontuário
│   ├── messages.js              # Central de mensagens e modelos de texto
│   ├── whatsapp.js              # Disparo de lembretes e integração WhatsApp
│   └── navigation.js            # Controle de navegação e menu mobile drawer
│
├── pages/                       # Subpáginas do sistema
│   ├── agendar.html             # Fluxo público de agendamento online
│   ├── contato.html             # Página pública de contato e localização
│   ├── servicos.html            # Catálogo público de tratamentos
│   ├── clinica-geral.html       # Página individual: Clínica Geral
│   ├── limpeza.html             # Página individual: Limpeza Dental
│   ├── aparelho-ortodontico.html# Página individual: Aparelho Ortodôntico
│   ├── implantes.html           # Página individual: Implantes Dentários
│   ├── dashboard.html           # Painel administrativo principal
│   ├── agenda.html              # Calendário e agenda da clínica
│   ├── agendamentos.html        # Listagem e filtros de agendamentos com dropdown
│   ├── pacientes.html           # Lista e busca de pacientes com dropdown
│   ├── paciente-detalhes.html   # Prontuário detalhado do paciente
│   ├── servicos-admin.html      # Gestão de procedimentos e valores
│   ├── planos.html              # Gestão de convênios e planos de atendimento
│   ├── horarios.html            # Gestão da grade de horários e expediente
│   ├── mensagens.html           # Caixa de entrada e templates de mensagens
│   ├── whatsapp.html            # Central de campanhas e envios por WhatsApp
│   ├── google-calendar.html     # Painel de sincronização Google Calendar
│   ├── configuracoes.html       # Configurações gerais do consultório
│   └── perfil.html              # Perfil do administrador e logout
│
├── scripts/
│   ├── seed-supabase.js         # Script para carga inicial no Supabase
│   └── sync-landing.js          # Script para recompilar HTML estático com dados do banco
│
└── supabase/
    └── schema.sql               # Script DDL completo (tabelas, índices e políticas RLS)
```

---

## 🚀 Como Executar o Projeto Localmente

### Método 1: Abertura Direta
Basta dar um duplo clique no arquivo [`index.html`](index.html) no gerenciador de arquivos para abri-lo diretamente em qualquer navegador moderno.

### Método 2: Servidor Local (Recomendado)
Para uma experiência completa com módulos ES6:

- **Via Python:**
  ```bash
  python -m http.server 3000
  ```
  Acesse no navegador: `http://localhost:3000`

- **Via Node.js (`npx`):**
  ```bash
  npx serve .
  ```

- **Via VS Code / IDE:**
  Com a extensão **Live Server**, abra `index.html` e clique em *"Go Live"*.

---

## 🗄️ Configuração do Supabase (Banco de Dados & Autenticação)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo de [`supabase/schema.sql`](supabase/schema.sql), cole no editor e clique em **Run**.
4. Copie o arquivo `.env.example` para `.env` e preencha suas chaves:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anon-publica
   SUPABASE_SECRET_KEY=sua-chave-service-role
   ```
5. *(Opcional)* Para popular os dados iniciais pelo terminal:
   ```bash
   node scripts/seed-supabase.js
   ```

---

## 🔄 Como Recompilar a Landing Page com os Dados do Banco

Sempre que desejar regerar os arquivos HTML estáticos com os dados mais recentes de serviços, planos e horários para deploys estáticos ou otimização de SEO:

```bash
node scripts/sync-landing.js
```

O script buscará os registros atualizados e recompilará automaticamente `index.html`, `pages/servicos.html` e `pages/contato.html`.

---

## 🧪 Roteiro de Testes Automatizados & Validação da Plataforma

O projeto conta com uma suíte completa de automação de testes E2E executada nativamente via **Chrome DevTools Protocol (CDP)** sem necessidade de frameworks pesados, além de documentação pronta para exportação para outras ferramentas (Playwright, Cypress, Selenium, Postman).

### Executar a Suíte de Testes Localmente:
```bash
node test-automation/runner.js
```

### O que o roteiro valida:
1. **Conexão e Autenticação Supabase:** Verificação de endpoints de saúde e login JWT via Supabase Auth com senhas criptografadas.
2. **Landing Page Dinâmica (LandingSync):** Verificação de injeção de serviços, planos e expediente.
3. **Dashboard Administrativo:** Carga de indicadores clínicos e financeiros.
4. **CRUD de Pacientes:** Criação de novos pacientes no banco, listagem e menu de ações flutuante.
5. **CRUD de Agendamentos:** Criação de consultas, verificação de dados e menu de ações.
6. **Agenda Interativa:** Calendário, visão diária e exclusão de consultas em tempo real no banco.
7. **Serviços, Planos e Horários:** Gestão de procedimentos, planos com destaque e expediente de funcionamento.
8. **Auditoria Geral de Telas:** Varredura em 12 páginas públicas e administrativas garantindo ausência de erros e integridade de navegação.

### Resultados e Evidências Geradas:
- Especificação técnica para outras plataformas: [`test-automation/plano-de-teste.md`](test-automation/plano-de-teste.md)
- Relatório em formato JSON: `test-automation/results/relatorio-testes.json`
- Relatório interativo em HTML: `test-automation/results/relatorio-testes.html`
- Capturas de tela (Screenshots de cada etapa): `test-automation/results/screenshots/`

---

## 📱 Responsividade & Suporte Multiplataforma

O projeto é 100% responsivo e foi validado em diversas resoluções:
- **Mobile (Smartphones até 480px e 768px):** Menu em gaveta lateral deslizante (*drawer*), botões agrupados em dropdowns, tabelas com rolagem touch suave e formulários adaptados em coluna única.
- **Tablets (769px a 1024px):** Grids adaptativos de 2 colunas e agenda redimensionável.
- **Desktops & Telas Ultrawide (1025px+):** Sidebar fixa com navegação rápida, métricas em 4 colunas e aproveitamento pleno do espaço de visualização clínica.

---

## 📄 Licença & Autoria

- **Projeto:** Plataforma Odontológica & Gestão Clínica
- **Repositório Oficial:** [github.com/pycriador/consultorio-agendamento](https://github.com/pycriador/consultorio-agendamento)
- **Licença:** Distribuído sob a licença MIT. Livre para uso pessoal e comercial.
