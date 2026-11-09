# Olivelas Restaurant 🍽️

> **Gestão inteligente para restaurantes**  
> Gerencie mesas, cardápio, pedidos, cozinha e equipe em um único sistema, criado para funcionar tanto online quanto offline.

---

## 🎯 Fase 01 — Landing Page + Autenticação

Esta etapa consolida a fundação visual premium e a experiência de autenticação do sistema SaaS:

- **Landing Page Completa e Responsiva**:
  - Header adaptativo com navegação, troca de tema e menu mobile.
  - Seção Hero de alto impacto com mockup visual fidedigno de software operacional (Mesa 05, Pedido #1042, R$ 86,80, em preparo).
  - Seção de Benefícios (Gestão de mesas, Pedidos, Cozinha, Operação Offline).
  - Seção "Como funciona" (fluxo de 5 etapas do cadastro à entrega).
  - Seção Offline destacando a arquitetura local-first com sincronização automática.
  - Seção para Diferentes Usuários (Administrador, Garçom, Cozinha, Cliente).
  - Chamada para ação final e Rodapé institucional sem links quebrados.
- **Autenticação**:
  - Tela de Login (`/login`) com e-mail/senha, recuperação e botão Google.
  - Tela de Cadastro (`/register`) com validação de campos, confirmação de senha e fluxo Google.
  - Recuperação de Senha (`/forgot-password`) com feedback em tempo real.
  - Área Autenticada Provisória (`/app`) com logout e status da sessão.
  - Proteção de rotas com redirecionamento inteligente (`/app/*` protegido; `/login` redireciona para `/app` se autenticado).
- **Temas**:
  - Light Mode & Dark Mode sofisticado (paleta refinada sem preto chapado ou neon artificial).
  - Opção de tema automático pelo Sistema.
  - Persistência em `localStorage` e script anti-FOUC no `index.html`.
- **Backend & Supabase**:
  - Cliente configurado em `src/lib/supabase.ts` via variáveis de ambiente.
  - Modo demonstração automático quando as credenciais ainda não foram fornecidas, permitindo testar toda a navegação e interface sem quebras.
- **PWA-Ready**:
  - `manifest.webmanifest`, ícones SVG (192px e 512px), theme-color e modo `standalone`.
- **Deploy GitHub Pages**:
  - Workflow automatizado do GitHub Actions em `.github/workflows/deploy.yml`.
  - Suporte a SPA routing com `404.html` e decodificação no `index.html`.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite** (Build ultra-rápido)
- **Tailwind CSS** + Tokens CSS para Light/Dark mode
- **Radix UI** + **Lucide React** (Ícones e acessibilidade)
- **Sonner** (Notificações toast elegantes sem `alert()`)
- **React Router** (Navegação SPA)
- **Supabase** (`@supabase/supabase-js`)

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/seu-usuario/olivelas-restaurant.git
cd olivelas-restaurant
npm install
```

### 2. Configurar variáveis de ambiente (Opcional para modo real Supabase)

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha com os dados do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> **Nota:** Caso as variáveis não sejam preenchidas, a aplicação iniciará em modo de demonstração seguro, permitindo navegar por todas as telas e testar a área autenticada provisória.

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

### 4. Build de Produção

```bash
npm run build
npm run preview
```

---

## 📁 Estrutura de Pastas

```text
src/
├── components/
│   ├── layout/            # Header, Footer, AuthLayout
│   ├── landing/           # Hero, ProductMockup, Benefits, HowItWorks, Offline, UserProfiles, FinalCta
│   └── ui/                # Button, Input, Label, Card, Badge, ThemeToggle, Logo, Separator
├── contexts/
│   ├── AuthContext.tsx    # Gerenciamento de sessão, Supabase e demo fallback
│   └── ThemeContext.tsx   # Sistema, Claro, Escuro com sincronização local
├── hooks/
│   ├── useAuth.ts
│   └── useTheme.ts
├── lib/
│   └── supabase.ts        # Inicialização do Supabase Client
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── AppPage.tsx
├── routes/
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── PublicOnlyRoute.tsx
├── types/
│   ├── auth.ts
│   └── theme.ts
├── utils/
│   └── cn.ts
├── App.tsx
├── index.css
└── main.tsx
```

---

## 🔒 Segurança e Boas Práticas

- Nenhuma credencial privada ou service role exposta no frontend.
- Tratamento amigável de erros (sem alert do navegador).
- Acessibilidade com labels explícitos, foco visível e navegação por teclado.
- Sem overflow horizontal em telas mobile, tablets ou desktops.
- Suporte a Tablets para operação em salão e cozinha.

---

## 🧪 Bateria de Testes Operacionais & Evidências E2E

O sistema foi submetido a uma bateria completa e automatizada de testes ponta a ponta (E2E) com **Puppeteer & Chrome Headless**, cobrindo o ciclo de vida operacional integral do restaurante:

1. **Gestão de Equipe**: Cadastro de funcionários em todos os 5 papéis funcionais (`restaurant_admin`, `manager`, `waiter`, `kitchen`, `cashier`) além de `Global Admin`.
2. **Cardápio & Cocção**: Cadastro e configuração de cortes nobres de carne (ex: *Ancho Angus na Brasa 350g*), pontos da carne (*Mal Passado*, *Ao Ponto*, *Bem Passado*) e bebidas autorais (*Gin Tônica Mediterrâneo*).
3. **Salão & Comandas**: Abertura de comanda na Mesa 03 com associação de cliente e garçom, seleção de carne com ponto especificado e bebida.
4. **Cozinha & KDS**: Transmissão em tempo real da comanda para a praça de cozinha, início de preparo, sinalização de prato pronto e devolução/entrega ao garçom.
5. **Autoatendimento & Checkout**: Emissão da comanda digital do cliente com QR Code PIX dinâmico (payload EMV instantâneo) e conciliação no Caixa/PDV.

### 📊 Formatos de Acesso às Evidências

- 🌐 **Página Interativa no App:** [`/evidence`](https://pycriador.github.io/olivelas-restaurant/evidence) *(disponível no menu da Landing Page com lightbox e zoom)*
- 📑 **Documentação Detalhada com Imagens em Markdown:** [**`docs/TEST_EVIDENCES.md`**](docs/TEST_EVIDENCES.md)
- 🖥️ **Relatório Standalone HTML:** [**`docs/test-evidence.html`**](docs/test-evidence.html) *(ou localmente em `http://localhost:5173/test-evidence.html`)*

### 📸 Tabela de Cenários e Capturas Homologadas

| # | Cenário Testado | Módulo | Imagem | Documentação | Status |
|---|---|---|---|---|---|
| **01** | Equipe com todos os 5 papéis operacionais ativos | `/app/team` | [`01-team-management-all-roles.png`](public/evidence/01-team-management-all-roles.png) | [Ver no MD](docs/TEST_EVIDENCES.md#01-cadastro-completo-da-equipe-5-papéis-operacionais) | ✅ Aprovado |
| **02** | Modal de convite e cadastro de novo colaborador | `/app/team` | [`02-team-add-member-modal.png`](public/evidence/02-team-add-member-modal.png) | [Ver no MD](docs/TEST_EVIDENCES.md#02-modal-de-admissão--atribuição-de-cargo) | ✅ Aprovado |
| **03** | Catálogo de produtos, cortes nobres e coquetelaria | `/app/menu/products` | [`03-menu-products-catalog.png`](public/evidence/03-menu-products-catalog.png) | [Ver no MD](docs/TEST_EVIDENCES.md#03-catálogo-de-produtos-cortes-nobres-e-bebidas) | ✅ Aprovado |
| **04** | Adicionais e seleção dos pontos da carne | `/app/menu/add-ons` | [`04-menu-meat-doneness-addons.png`](public/evidence/04-menu-meat-doneness-addons.png) | [Ver no MD](docs/TEST_EVIDENCES.md#04-configuração-dos-pontos-da-carne-e-adicionais) | ✅ Aprovado |
| **05** | Mapa do salão com mesas, setores e ocupação | `/app/tables` | [`05-tables-floor-plan.png`](public/evidence/05-tables-floor-plan.png) | [Ver no MD](docs/TEST_EVIDENCES.md#05-mapa-do-salão-de-mesas--setores-personalizados) | ✅ Aprovado |
| **06** | Modal de abertura de comanda na Mesa 03 | `/app/tables/table-03` | [`06-open-comanda-modal.png`](public/evidence/06-open-comanda-modal.png) | [Ver no MD](docs/TEST_EVIDENCES.md#06-abertura-de-comanda-na-mesa-03) | ✅ Aprovado |
| **07** | Lançamento de carne com anotação do ponto | `/app/tables/table-03` | [`07-comanda-item-selection-with-doneness.png`](public/evidence/07-comanda-item-selection-with-doneness.png) | [Ver no MD](docs/TEST_EVIDENCES.md#07-lançamento-de-corte-com-seleção-do-ponto-da-carne) | ✅ Aprovado |
| **08** | Comanda ativa com corte nobre, bebida e totais | `/app/tables/table-03` | [`08-comanda-items-added.png`](public/evidence/08-comanda-items-added.png) | [Ver no MD](docs/TEST_EVIDENCES.md#08-comanda-ativa-com-corte-nobre-e-bebida-alcoólica) | ✅ Aprovado |
| **09** | Disparo e envio do pedido para a cozinha | `/app/tables/table-03` | [`09-comanda-sent-to-kitchen.png`](public/evidence/09-comanda-sent-to-kitchen.png) | [Ver no MD](docs/TEST_EVIDENCES.md#09-disparo-e-transmissão-do-pedido-para-a-cozinha) | ✅ Aprovado |
| **10** | Monitor KDS da cozinha com ticket em preparo | `/app/kds` | [`10-kds-kitchen-queue.png`](public/evidence/10-kds-kitchen-queue.png) | [Ver no MD](docs/TEST_EVIDENCES.md#10-monitor-kds-da-cozinha-ticket-recebido-em-preparo) | ✅ Aprovado |
| **11** | KDS com prato finalizado e pronto para servir | `/app/kds` | [`11-kds-dish-prepared-ready.png`](public/evidence/11-kds-dish-prepared-ready.png) | [Ver no MD](docs/TEST_EVIDENCES.md#11-finalização-do-prato-no-kds-pronto-para-servir) | ✅ Aprovado |
| **12** | KDS com prato liberado e entregue ao garçom | `/app/kds` | [`12-kds-dish-delivered-to-waiter.png`](public/evidence/12-kds-dish-delivered-to-waiter.png) | [Ver no MD](docs/TEST_EVIDENCES.md#12-liberação-e-devolução-do-prato-ao-garçom) | ✅ Aprovado |
| **13** | Salão com pedido entregue à mesa e pré-conta | `/app/tables/table-03` | [`13-table-order-delivered-salon.png`](public/evidence/13-table-order-delivered-salon.png) | [Ver no MD](docs/TEST_EVIDENCES.md#13-salão-pedido-servido-na-mesa-03-e-pré-conta) | ✅ Aprovado |
| **14** | Comanda digital do cliente com QR Code PIX | `/comanda/table-03` | [`14-digital-comanda-customer-qrcode-pix.png`](public/evidence/14-digital-comanda-customer-qrcode-pix.png) | [Ver no MD](docs/TEST_EVIDENCES.md#14-comanda-digital-do-cliente-com-qr-code--pix-dinâmico) | ✅ Aprovado |
| **15** | Painel Caixa/PDV com liquidação e baixa | `/app/cashier` | [`15-cashier-checkout-payment.png`](public/evidence/15-cashier-checkout-payment.png) | [Ver no MD](docs/TEST_EVIDENCES.md#15-frente-de-caixa--pdv-liquidação-e-encerramento) | ✅ Aprovado |

---

## 🤖 Roteiro de Testes para Automação Externa (QA Blueprint)

Para viabilizar a reprodução e automação do ciclo operacional completo em ferramentas externas (como **Playwright**, **Cypress**, **Selenium** ou **Postman**), a plataforma disponibiliza um pacote completo de automação em restaurante de testes isolado (`Bistrô QA Lab` / `rest-qa-lab`):

- 📋 [**`tests/e2e-automation-plan/ROTEIRO_TESTES_E2E.md`**](tests/e2e-automation-plan/ROTEIRO_TESTES_E2E.md): Roteiro oficial passo a passo com seletores, ações, payloads e exemplos prontos em Playwright (TypeScript) e Cypress (JavaScript).
- ⚙️ [**`tests/e2e-automation-plan/test-flow-spec.json`**](tests/e2e-automation-plan/test-flow-spec.json): Especificação JSON estruturada com todos os 14 cenários, seletores e asserções para importação direta em ferramentas de teste.
- 🚀 **Script Executor Local:** Execute o roteiro completo a qualquer momento via terminal:
  ```bash
  node scripts/execute-qa-test-plan.mjs
  ```
- 📁 **Resultados Gravados Localmente:**
  - `tests/test-results/screenshots/`: 16 capturas de tela em alta resolução documentando cada etapa.
  - `tests/test-results/execution-report.json`: Dados brutos de tempo de execução e status das asserções.
  - `tests/test-results/execution-summary.md`: Relatório executivo do teste.
  - `tests/test-results/index.html`: Dashboard interativo local para inspeção visual dos testes.

---

## 📋 Status dos Módulos

- **Gestão Global SaaS & Multi-Tenant**: ✅ 100% Concluído
- **Cadastro e Permissões por Papel (RBAC)**: ✅ 100% Concluído
- **Cardápio, Categorias, Produtos e Adicionais**: ✅ 100% Concluído
- **Mapa de Mesas, Setores Personalizados e Comandas**: ✅ 100% Concluído
- **Monitor KDS da Cozinha em Tempo Real**: ✅ 100% Concluído
- **Comanda Digital do Cliente com PIX Dinâmico**: ✅ 100% Concluído
- **Frente de Caixa, Turnos e Conciliação**: ✅ 100% Concluído

---

## 🚀 CI/CD & Deploy

### 1. GitHub Pages (SPA)
O projeto conta com automação via GitHub Actions (`.github/workflows/deploy.yml`) para build e publicação automática no GitHub Pages a cada push na branch `main`:
- **Base Path**: Configurado dinamicamente para `/olivelas-restaurant/`.
- **Roteamento SPA**: Suporte a refresh e URLs profundas via script de redirecionamento `404.html` e decodificação em `index.html`.
- **Variáveis de Ambiente**: As variáveis de conexão pública com o Supabase são injetadas no build automaticamente.

### 2. Workflow Supabase CI & Migrations
O workflow (`.github/workflows/supabase.yml`) gerencia o ciclo de vida do banco de dados:
- **Validação de Sintaxe**: Analisa e lint os scripts em `supabase/migrations/` em pull requests e pushes.
- **Push Automático**: Sincroniza as migrações na instância remota do Supabase quando configurados os Secrets:
  - `SUPABASE_ACCESS_TOKEN` (Personal Access Token gerado no dashboard do Supabase)
  - `SUPABASE_PROJECT_ID` (ID do projeto: `pkbjoxzqllextmtmjoia`)
  - `SUPABASE_DB_PASSWORD` (Senha do banco PostgreSQL)
- **Execução Manual**: Suporte a disparo manual via `workflow_dispatch` com opções de `deploy`, `dry-run` e `lint-only`.

