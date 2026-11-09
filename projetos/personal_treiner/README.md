# 🏋️‍♀️ RAFAELA PERSONAL APP • Plataforma Completa de Treinamento & Acompanhamento

Plataforma web profissional, responsiva e mobile-first para a personal trainer **Rafaela** gerenciar seus alunos, prescrever treinos com flexibilidade controlada, orientar planos nutricionais, acompanhar a evolução física e auditar em tempo real a execução prática de cada série.

---

## 🌟 Destaques da Plataforma

- **Dual-Portal**: Acesso diferenciado e seguro para a **Personal Trainer** e para os **Alunos**.
- **Auditabilidade Absoluta (Regra de Ouro)**: Comparação contínua de **Prescrito vs. Executado vs. Alterado**. Cada carga aumentada/reduzida, exercício substituído ou pulado pelo aluno gera um log detalhado com data, motivo e impacto.
- **Mini Vídeos de Exercícios Locais**: Biblioteca com **32 exercícios** e **96 frames vetoriais SVG de alta definição** (`1 -> 2 -> 3 -> 2 -> 1`), simulando as fases concêntrica e excêntrica sem latência de rede ou custos de streaming.
- **Backup Seguro & Conformidade LGPD**: Exportação do banco completo em `.JSON` com **senhas protegidas por hash criptográfico (SHA-256 com salt)** e downloads de planilhas `.CSV` por tabela.
- **Filtros e Paginação na URL**: Todas as listagens essenciais suportam filtros reativos e paginação persistida nos search params (`?page=1&query=...`), permitindo compartilhamento de links e navegação fluida.
- **Arquitetura Híbrida Desacoplada (Repository Pattern)**: Suporta **Supabase (PostgreSQL)** como backend primário e conta com fallback transparente para armazenamento local em caso de falta de conexão ou ambiente offline.

---

## 📱 Funcionalidades

### 👩‍🏫 Portal da Personal Trainer (`/personal/*`)

1. **Dashboard Geral (`/personal/dashboard`)**:
   - Indicadores ao vivo: total de alunos ativos, treinos concluídos hoje, adesão média global e taxa de conclusão.
   - **Feed de Auditoria em Tempo Real**: acompanhamento instantâneo de cargas alteradas, exercícios substituídos e justificativas enviadas pelos alunos.
   - Alertas rápidos de aniversários da semana e próximos treinos agendados.
2. **Gestão de Alunos (`/personal/students`)**:
   - Listagem com busca textual, filtro de status (Ativo, Pausado, Arquivado) e paginação na URL.
   - Cadastro completo de novos alunos com restrições físicas, rotina, metas e nível de treinamento.
   - Perfil individual do aluno (`/personal/students/:id`) com abas estruturadas:
     - **Resumo**: estatísticas de adesão, perfil e resumo de alterações.
     - **Treinos**: plano de treino ativo com botões de visualização dos mini vídeos e permissões.
     - **Histórico & Auditoria**: histórico de todas as sessões realizadas com comparativo de carga.
     - **Alimentação**: plano alimentar do aluno com gerenciamento direto de refeições.
     - **Evolução**: gráficos de peso e evolução de cargas em exercícios-chave.
     - **Configurações**: controles para pausar e arquivar o aluno.
3. **Prescrição & Montagem de Treinos (`/personal/workouts/new`)**:
   - Seleção de aluno com filtro e paginação por URL.
   - Divisão de treinos por dias da semana (Segunda a Sábado) e foco muscular.
   - Adição visual de exercícios com pré-visualização de imagem cartoon.
   - Configuração granular de permissões por exercício:
     - Permitir alteração de carga.
     - Permitir substituição por alternativas autorizadas.
     - Permitir pular exercício com justificativa.
4. **Biblioteca de Exercícios (`/personal/exercises`)**:
   - Catálogo de exercícios categorizados (Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Core).
   - Player vetorial interativo com controles de reprodução, ajuste de velocidade (`0.5x`, `1x`, `1.5x`) e seletor de postura por fase (Início, Transição e Pico).
   - Filtros combinados por busca, categoria, tipo de equipamento e nível de dificuldade, integrados à URL.
   - Cadastro e edição de novos exercícios com alternativas sugeridas.
5. **Central de Nutrição (`/personal/nutrition`)**:
   - Navegação de alunos com paginação e busca por URL.
   - CRUD completo de refeições (Café da manhã, Almoço, Lanche, Jantar, Ceia).
   - Adição, edição e exclusão de itens alimentares, quantidades, sugestões de substituições e notas nutricionais.
6. **Evolução & Bioimpedância (`/personal/evolution`)**:
   - Seletor de aluno com gráficos dinâmicos de curva de peso corporal.
   - Acompanhamento de sobrecarga progressiva (evolução de cargas em kg ao longo do tempo).
   - Galeria de fotos comparativas antes/depois para visualização de resultados estéticos.
7. **Relatórios & Métricas (`/personal/reports`)**:
   - Gráficos consolidados de frequência, adesão dos alunos e volume semanal de séries.
   - Tabela analítica com opção de exportação.
8. **Configurações & Central de Backup (`/personal/settings`)**:
   - Contadores em tempo real de registros em cada tabela do sistema.
   - **Download do Banco Completo (.JSON)** com credenciais criptografadas via Web Crypto API (SHA-256 com salt) - zero senhas em texto puro.
   - **Exportação Individual (.CSV)** para Alunos, Treinos, Sessões, Auditoria, Nutrição e Usuários.
   - Conformidade com as diretrizes de privacidade e LGPD.

---

### 🏃‍♂️ Portal do Aluno (`/student/*`)

1. **Dashboard do Aluno (`/student/dashboard`)**:
   - Card em destaque com o treino prescrito para o dia de hoje e atalho para início imediato.
   - Contador de consistência (dias seguidos) e metas semanais cumpridas.
   - Feed com as últimas sessões e atalhos rápidos.
2. **Execução de Treino Ativo (`/student/workout/active/:dayId`)**:
   - Interface com botões táteis grandes, projetada para uso em smartphones dentro da academia.
   - **Mini player de movimento animado**: animação vetorial do exercício atual para validação de postura.
   - **Cronômetro de descanso regressivo (`RestTimer`)**: dispara automaticamente ao concluir cada série com notificações visuais e sonoras.
   - **Alteração de carga flexível**: o aluno pode ajustar o peso executado (+/- kg), gerando automaticamente a notificação para a Rafaela.
   - **Substituição inteligente**: caso uma máquina esteja ocupada, o aluno pode substituir por um exercício alternativo pré-aprovado pela Rafaela.
   - **Pulo seguro**: opção de pular um exercício mediante preenchimento rápido de justificativa.
   - Finalização do treino com animação de confetes e salvamento instantâneo da sessão.
3. **Meus Treinos (`/student/workouts`)**:
   - Lista completa de todos os dias prescritos e exercícios detalhados.
4. **Minha Alimentação (`/student/nutrition`)**:
   - Guia diário de refeições com opções autorizadas de substituição de alimentos.
5. **Minha Evolução (`/student/evolution`)**:
   - Histórico de pesagens, progresso de cargas nos exercícios favoritos e fotos de evolução.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite
- **Estilização**: Tailwind CSS, Design System Dark/Light Mode
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Efeitos**: Canvas Confetti
- **Banco de Dados & Backend**: Supabase (PostgreSQL + REST API)
- **Biblioteca de Movimentos**: Vetores SVG locais adaptados de bryllim/workout-guide
- **Linter & Performance**: Oxlint

---

## 📂 Estrutura do Projeto

```text
rafaela-personal-app/
├── public/
│   └── exercises/
│       └── frames/              # 96 SVGs vetoriais dos 32 exercícios (frame-1, 2, 3)
├── scripts/
│   └── seed-supabase.cjs        # Script de carga inicial e migração para o Supabase
├── src/
│   ├── components/
│   │   ├── layout/              # Header, Sidebar, Bottom Nav
│   │   └── ui/                  # Button, Card, Modal, Tabs, ExerciseFramePlayer, RestTimer
│   ├── context/                 # AuthContext e ThemeContext
│   ├── data/                    # Dados iniciais e catálogos de exercícios
│   ├── layouts/                 # PersonalLayout e StudentLayout
│   ├── lib/                     # Configuração do cliente Supabase e utilitários
│   ├── pages/
│   │   ├── auth/                # LoginPage com alternador de perfis
│   │   ├── personal/            # Dashboard, Students, Workouts, Exercises, Nutrition, etc.
│   │   └── student/             # Dashboard, ActiveWorkout, Nutrition, Evolution
│   ├── repositories/            # Camada de abstração de dados (Supabase + LocalStorage fallback)
│   └── types/                   # Interfaces TypeScript completas
├── supabase/
│   └── schema.sql               # Esquema DDL para criação das tabelas no Supabase
├── .env.example                 # Exemplo de configuração de variáveis de ambiente
├── test-flow.js                 # Teste automatizado do fluxo ponta a ponta
└── package.json
```

---

## 🚀 Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/pycriador/rafaela-personal-app.git
cd rafaela-personal-app
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Preencha o `.env` com as credenciais do seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```
> **Nota de Segurança**: O arquivo `.env` está incluído no `.gitignore` e **nunca** é enviado para o GitHub. Se nenhuma chave for informada, a aplicação opera automaticamente em modo local/offline através do cache do navegador.

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

### 5. Executar o Teste Automatizado de Fluxo
Valida o login da Rafaela, seleção de aluno, início de treino pela Mariana, alteração de carga, substituição, pulo de exercício, auditoria no dashboard e salvamento:
```bash
npm run test:flow
```

### 6. Gerar Build de Produção
```bash
npm run build
```

---

## 👥 Credenciais de Demonstração (Mock Auth)

O app conta com perfis pré-cadastrados para teste rápido:

| Usuário | E-mail | Senha Padrão | Perfil | Detalhes |
|---|---|---|---|---|
| **Rafaela** | `rafaela@mock.com` | `123456` | Personal Trainer | Acesso administrativo irrestrito |
| **Mariana** | `mariana@mock.com` | `123456` | Aluna | Foco em Hipertrofia (Seg/Qua/Sex) |
| **João** | `joao@mock.com` | `123456` | Aluno | Foco em Emagrecimento (Ter/Qui) |
| **Carlos** | `carlos@mock.com` | `123456` | Aluno | Foco em Condicionamento Físico |
| **Ana** | `ana@mock.com` | `123456` | Aluna | Corrida & Resistência Cardiovascular |
| **Fernanda** | `fernanda@mock.com` | `123456` | Aluna | Força & Ganho de Massa Muscular |

---

## 🧪 Evidências de Testes & Homologação E2E (100% Aprovado)

A plataforma conta com uma suíte de automação End-to-End (E2E) com **Playwright & Chromium/Edge**, validando integralmente 26 fluxos críticos do sistema (administração da personal, prescrição técnica, gamificação, portal do aluno e landing pages).

- 🌐 **Página Pública de Evidências no App**: Acesse diretamente pela rota [`/evidencias`](https://pycriador.github.io/rafaela-personal-app/evidencias) ou pelo botão no menu da Landing Page.
- 🖼️ **Galeria Completa em Markdown**: Visualize todas as 26 telas com imagens embutidas em alta definição em [`EVIDENCIAS.md`](EVIDENCIAS.md).
- 📊 **Relatório Executivo Interativo HTML**: Relatório técnico com lightbox em [`docs/test-evidence/relatorio_testes.html`](docs/test-evidence/relatorio_testes.html).

### 📸 Tabela de Cenários e Evidências Fotográficas

| ID | Cenário / Fluxo | Categoria | Status | Evidência Fotográfica |
|:---|:---|:---|:---:|:---:|
| **TC-01** | Tela de Autenticação & Quick Login | Autenticação | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/01-login-screen.png) |
| **TC-02** | Dashboard do Personal Trainer | Personal Trainer | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/02-dashboard-personal.png) |
| **TC-03** | Listagem de Alunos com Filtros & Status | Gestão de Alunos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/03-students-list.png) |
| **TC-04** | Cadastro de Novo Aluno (Metas, Rotina, Nível) | Gestão de Alunos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/04-student-create-form.png) |
| **TC-05** | Confirmação de Aluno Cadastrado na Listagem | Gestão de Alunos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/05-student-created-in-list.png) |
| **TC-06** | Ficha Completa do Aluno & Painel de Métricas | Gestão de Alunos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/06-student-detail-overview.png) |
| **TC-07** | Biblioteca de Exercícios com Player SVG | Treinos & Exercícios | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/07-exercises-library.png) |
| **TC-08** | Modelos Prontos de Séries (Templates) | Treinos & Exercícios | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/08-workout-templates.png) |
| **TC-09** | Prescrição & Construtor de Treinos | Treinos & Exercícios | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/09-workout-builder.png) |
| **TC-10** | Gestão Nutricional & Planos Alimentares | Nutrição & Dietas | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/10-nutrition-management.png) |
| **TC-11** | Formulários - Visão Geral (`/personal/forms/geral`) | Formulários | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/11-forms-overview.png) |
| **TC-12** | Formulários - Modelos de Fichas (`/personal/forms/fichas`) | Formulários | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/12-forms-templates.png) |
| **TC-13** | Editor de Perguntas com Seletor Visual Elegante | Formulários | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/13-form-question-editor.png) |
| **TC-14** | Formulários - Envios & Respostas dos Alunos | Formulários | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/14-forms-applications.png) |
| **TC-15** | Configurações - Permissões HBAC em Tabela | Configurações & HBAC | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/15-settings-permissions-table.png) |
| **TC-16** | Configurações - Mini CMS Landing Page | Configurações & HBAC | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/16-settings-landing-cms.png) |
| **TC-17** | Relatórios & Métricas de Negócio | Relatórios & BI | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/17-reports-bi.png) |
| **TC-18** | Gestão de Planos & Cupons Promocionais | Financeiro & Planos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/18-plans-and-coupons.png) |
| **TC-19** | Ranking & Gamificação - Painel Personal | Gamificação | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/19-ranking-personal.png) |
| **TC-20** | Portal do Aluno - Dashboard & Streak | Portal do Aluno | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/20-student-dashboard.png) |
| **TC-21** | Portal do Aluno - Plano Alimentar | Portal do Aluno | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/21-student-nutrition.png) |
| **TC-22** | Portal do Aluno - Treino Ativo com Séries | Portal do Aluno | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/22-student-active-workout.png) |
| **TC-23** | Finalização de Treino & Pontuação do Ranking | Gamificação | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/23-student-workout-completed.png) |
| **TC-24** | Portal do Aluno - Ranking Geral dos Alunos | Gamificação | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/24-student-ranking-leaderboard.png) |
| **TC-25** | Exclusão Segura de Aluno com Confirmação | Gestão de Alunos | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/25-student-deletion-confirmed.png) |
| **TC-26** | Landing Page Pública da Treinadora | Público & CMS | ✅ PASS | [`Ver Print`](docs/test-evidence/screenshots/26-public-landing-page.png) |

---

## 🧪 Plano de Testes & Roteiro de Automação para Outras Plataformas

Para viabilizar a **automação e reprodução dos testes em qualquer plataforma ou ferramenta** (como **Cypress**, **Selenium WebDriver**, **Postman/Newman**, **Robot Framework** ou pipelines de **CI/CD**), foi criado um **Roteiro Técnico Agnóstico de Testes E2E** cobrindo o ciclo de vida completo da aplicação, acompanhado de script executável e evidências gravadas localmente.

### 📑 Documentos e Relatórios do Plano de Teste
- 📘 **Especificação Completa & Roteiro Agnóstico**: [`plano-de-testes/ROTEIRO_AUTOMACAO_TESTES.md`](plano-de-testes/ROTEIRO_AUTOMACAO_TESTES.md) (com pré-condições, payloads JSON, seletores universais, asserções de UI/Storage e diagrama de fluxo).
- 📊 **Relatório Executivo Interativo HTML**: [`plano-de-testes/resultados/relatorio-execucao.html`](plano-de-testes/resultados/relatorio-execucao.html).
- 📝 **Relatório de Execução em Markdown**: [`plano-de-testes/resultados/RESULTADOS_EXECUCAO.md`](plano-de-testes/resultados/RESULTADOS_EXECUCAO.md).
- 📦 **Dados de Execução Estruturados (JSON)**: [`plano-de-testes/resultados/relatorio-execucao.json`](plano-de-testes/resultados/relatorio-execucao.json).
- 🤖 **Script de Execução Automatizada**: [`plano-de-testes/executar-roteiro-automacao.js`](plano-de-testes/executar-roteiro-automacao.js).

### 🚀 Como Executar o Roteiro Localmente
```bash
# 1. Iniciar o servidor preview ou de desenvolvimento
npm run build
npx vite preview --host 0.0.0.0 --port 4173

# 2. Em outro terminal, executar a suíte automatizada
node plano-de-testes/executar-roteiro-automacao.js
```

### 📸 Tabela de Execução do Roteiro E2E (15 Passos • 100% PASS)

| Passo | Cenário / Ação Automatizada | Módulo | Status | Evidência Fotográfica |
|:---:|:---|:---|:---:|:---:|
| **STEP-01** | Tela de Login & Quick Login Master | Autenticação | ✅ PASS | [`01-login-screen.png`](plano-de-testes/resultados/screenshots/01-login-screen.png) |
| **STEP-02** | Dashboard Inicial do Personal Trainer | Personal Trainer | ✅ PASS | [`02-dashboard-personal.png`](plano-de-testes/resultados/screenshots/02-dashboard-personal.png) |
| **STEP-03** | Modal de Cadastro de Personal Trainer | Gestão de Personais | ✅ PASS | [`03-modal-novo-personal.png`](plano-de-testes/resultados/screenshots/03-modal-novo-personal.png) |
| **STEP-04** | Novo Personal Cadastrado e Listado no Grid | Gestão de Personais | ✅ PASS | [`04-personal-cadastrado-sucesso.png`](plano-de-testes/resultados/screenshots/04-personal-cadastrado-sucesso.png) |
| **STEP-05** | Formulário de Cadastro do Aluno | Gestão de Alunos | ✅ PASS | [`05-formulario-cadastro-aluno.png`](plano-de-testes/resultados/screenshots/05-formulario-cadastro-aluno.png) |
| **STEP-06** | Confirmação do Aluno na Listagem Geral | Gestão de Alunos | ✅ PASS | [`06-aluno-cadastrado-na-lista.png`](plano-de-testes/resultados/screenshots/06-aluno-cadastrado-na-lista.png) |
| **STEP-07** | Ficha Geral e Perfil Técnico do Aluno | Gestão de Alunos | ✅ PASS | [`07-perfil-aluno-detalhes.png`](plano-de-testes/resultados/screenshots/07-perfil-aluno-detalhes.png) |
| **STEP-08** | Parametrização de Plano & Mensalidades | Financeiro & Planos | ✅ PASS | [`08-configuracao-mensalidade-modal.png`](plano-de-testes/resultados/screenshots/08-configuracao-mensalidade-modal.png) |
| **STEP-09** | Prescrição Técnica no Construtor de Treinos | Treinos & Exercícios | ✅ PASS | [`09-construtor-treinos-prescricao.png`](plano-de-testes/resultados/screenshots/09-construtor-treinos-prescricao.png) |
| **STEP-10** | Plano Nutricional & Dieta Configurada | Nutrição & Dietas | ✅ PASS | [`10-dieta-aluno-configurada.png`](plano-de-testes/resultados/screenshots/10-dieta-aluno-configurada.png) |
| **STEP-11** | Portal do Aluno - Dashboard & Treino do Dia | Portal do Aluno | ✅ PASS | [`11-portal-aluno-dashboard.png`](plano-de-testes/resultados/screenshots/11-portal-aluno-dashboard.png) |
| **STEP-12** | Portal do Aluno - Visualização de Dieta & Refeições | Portal do Aluno | ✅ PASS | [`12-portal-aluno-nutricao.png`](plano-de-testes/resultados/screenshots/12-portal-aluno-nutricao.png) |
| **STEP-13** | Portal do Aluno - Treino Ativo com Séries | Portal do Aluno | ✅ PASS | [`13-portal-aluno-treino-ativo.png`](plano-de-testes/resultados/screenshots/13-portal-aluno-treino-ativo.png) |
| **STEP-14** | Portal do Aluno - Gamificação & Ranking de Pontos | Gamificação | ✅ PASS | [`14-portal-aluno-ranking-pontos.png`](plano-de-testes/resultados/screenshots/14-portal-aluno-ranking-pontos.png) |
| **STEP-15** | Auditoria & Business Intelligence do Personal | Relatórios & BI | ✅ PASS | [`15-relatorios-bi-auditoria.png`](plano-de-testes/resultados/screenshots/15-relatorios-bi-auditoria.png) |

---

## 🌐 Deploy no GitHub Pages com Supabase

O projeto está 100% configurado com pipeline automatizado de CI/CD via **GitHub Actions** (`.github/workflows/deploy.yml`) para publicação contínua no **GitHub Pages** a cada `git push` na branch `main`.

### Passo a Passo para Ativação:

1. **Configurar os Secrets no Repositório GitHub**:
   - No GitHub, acesse seu repositório > **Settings** > **Secrets and variables** > **Actions**.
   - Clique no botão **New repository secret** e cadastre:
     - Nome: `VITE_SUPABASE_URL` | Valor: Sua URL do Supabase (ex: `https://seu-projeto.supabase.co`)
     - Nome: `VITE_SUPABASE_ANON_KEY` | Valor: Sua chave pública anônima do Supabase (`anon key`)

2. **Ativar o GitHub Pages via Actions**:
   - No repositório GitHub, acesse **Settings** > **Pages**.
   - Na seção **Build and deployment** > **Source**, selecione a opção **GitHub Actions**.

3. **Configurar as URLs no Painel do Supabase**:
   - No painel do Supabase, acesse **Authentication** > **URL Configuration**.
   - No campo **Site URL**, informe:
     `https://pycriador.github.io/rafaela-personal-app`
   - Em **Redirect URLs**, adicione:
     `https://pycriador.github.io/rafaela-personal-app/**`

4. **Deploy Automático**:
   - A cada `git push origin main`, o GitHub Actions compilará automaticamente a aplicação com o caminho base correto (`/rafaela-personal-app/`) e as credenciais seguras do Supabase.
   - O suporte a rotas diretas e F5 (SPA) está garantido através do fallback de redirecionamento em `public/404.html`.
   - O aplicativo estará acessível publicamente em:
     **`https://pycriador.github.io/rafaela-personal-app/`**

---

## 🔒 Segurança & Privacidade


- **Zero Credenciais Rastreadas**: Nenhuma chave privada, token ou URL de produção é mantida no código-fonte compartilhado.
- **Hashes Criptográficos**: Na exportação de dados em `/personal/settings`, as senhas são processadas com `crypto.subtle.digest('SHA-256')` enriquecidas com salt dinâmico, garantindo irreversibilidade.
- **Controle de Acesso**: Rotas do painel administrativo da personal são isoladas das rotas do portal do aluno via autenticação por role.

---

## 📄 Licença

Distribuído sob a licença MIT. Desenvolvido para modernizar e elevar a experiência de personal training da Rafaela e seus clientes.
