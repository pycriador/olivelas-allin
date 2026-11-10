# Olivelas GDrive Sync 🚀

Aplicação moderna, unificada e assíncrona em **TypeScript** (Express 5 + React 19) desenvolvida para sincronizar pastas locais (fotos, vídeos, backups e documentos) com o **Google Drive** através da API oficial v3, com armazenamento local seguro em **SQLite** criptografado.

---

## 📑 Sumário

- [Visão Geral e Diferenciais](#-visão-geral-e-diferenciais)
- [Arquitetura & Tecnologias](#-arquitetura--tecnologias)
- [Entendendo os Métodos de Autenticação](#-entendendo-os-métodos-de-autenticação)
- [Passo a Passo: Configuração no Google Cloud Console](#-passo-a-passo-configuração-no-google-cloud-console)
- [Solução de Problemas Comuns no Google Drive](#-solução-de-problemas-comuns-no-google-drive)
- [Instalação e Execução](#-instalação-e-execução)
- [Recursos da Interface](#-recursos-da-interface)
- [Segurança & Privacidade](#-segurança--privacidade)
- [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🌟 Visão Geral e Diferenciais

- **Menu Lateral & Layout Responsivo**:
  - Sidebar desktop elegante com monitoramento de cota do Drive em tempo real.
  - Header responsivo para mobile com gaveta deslizante (*drawer*) via menu hamburger.
- **Filtros e Paginação Integrados à URL**:
  - Localização rápida de pastas com filtros de estado (`?status=active|syncing|paused|error`).
  - Busca dinâmica em tempo real (`?search=termo`).
  - Paginação fluida vinculada à URL (`?page=1, 2...`) com suporte aos botões Voltar/Avançar do navegador.
- **Mapeamento Flexível de Diretórios**:
  - Configure múltiplos pares de pastas locais e remotas.
  - Navegadores visuais integrados para explorar o disco local (Windows) e as pastas do Google Drive com um clique.
- **Sincronização Inteligente & Assíncrona**:
  - Comparação por tamanho e hash MD5 para evitar uploads duplicados ou desnecessários.
  - Progresso em tempo real transmitido via **Server-Sent Events (SSE)**.
  - Botão de parada emergencial (*Stop Sync*) individual ou para todas as tarefas simultâneas.
- **Detecção Inteligente em Tempo Real (File Watcher com Debounce & Sugestão)**:
  - Monitoramento contínuo via `chokidar` de novas fotos ou arquivos adicionados/modificados nos diretórios mapeados.
  - **Tempo de Monitoramento Configurável**: Defina o tempo de espera/estabilização por pasta (5s, 10s, 30s, 1m, 5m ou customizado) para agrupar cópias em lote antes de alertar.
  - **Sugestão de Execução na Tela**: Banner e notificações em tempo real com botão **"Executar Sincronização Agora"** para disparar o upload com 1 clique, ou opção de envio 100% automático.
  - **Botão de Teste**: Valide o monitoramento de qualquer pasta instantaneamente direto pelo card.
- **Agendador Flexível (Cron Jobs)**:
  - Rotinas automáticas configuráveis por pasta (15 min, 30 min, 1h, 6h, diariamente ou cron customizado).
- **Segurança de Nível Bancário**:
  - Credenciais e tokens de acesso são salvos no SQLite com chave de criptografia **AES-256-GCM** vinculada ao hardware do computador.

---

## 🛠️ Arquitetura & Tecnologias

- **Backend**:
  - **Node.js** & **Express 5**
  - **TypeScript** em modo ESM estrito
  - **Better-SQLite3** com modo WAL ativado para alta performance
  - **Google APIs (`googleapis` v3)** com suporte total a Drives Pessoais e Compartilhados
  - **Chokidar v5** para monitoramento de eventos do sistema de arquivos
  - **Node-Cron** para agendamento de tarefas em background
- **Frontend**:
  - **React 19** & **Vite 8**
  - **Tailwind CSS v4** & Efeitos Glassmorphism
  - **Lucide React** para ícones vetoriais modernos
  - Comunicação reativa via **Server-Sent Events (SSE)** e **BroadcastChannel API**

---

## 🔑 Entendendo os Métodos de Autenticação

A aplicação possui suporte a dois modos distintos, projetados para cenários complementares:

| Recurso | 👤 OAuth 2.0 (Recomendado para Envio) | 🤖 Service Account (Robô / Autônomo) |
| :--- | :--- | :--- |
| **Finalidade Principal** | **Upload de arquivos e fotos para o Drive** | **Listagem, Downloads e Drives Compartilhados** |
| **Armazenamento / Cota** | Utiliza a cota da sua conta Google (15 GB grátis ou Google One) | Contas de serviço **não possuem cota própria** em contas `@gmail.com` |
| **Login** | Tela de login e consentimento Google no navegador | Arquivo de chave JSON (`credentials.json`) sem interação |
| **Drives Compartilhados** | Sim | Sim (excelente para automações corporativas / Shared Drives) |

> 💡 **Nota Importante:** Para enviar fotos e arquivos do seu computador para o seu Google Drive pessoal (`@gmail.com`), **utilize o OAuth 2.0**. As contas de serviço do Google retornam erro 403 (*storage quota*) ao tentar receber arquivos em drives pessoais gratuitos.

---

## 📋 Passo a Passo: Configuração no Google Cloud Console

Para conectar seu aplicativo ao Google Drive, siga estas etapas no Google Cloud:

### 1. Criar o Projeto
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo da página, clique no seletor de projetos e em **"Novo Projeto"**.
3. Escolha um nome (ex: `Olivelas GDrive Sync`) e clique em **Criar**.

### 2. Ativar a API do Google Drive
1. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
2. Pesquise por **"Google Drive API"**.
3. Clique em **Google Drive API** e depois no botão **"Ativar"** (ou acerte diretamente pela URL do seu projeto).

### 3. Configurar a Tela de Permissão OAuth (Consent Screen)
1. Acesse **APIs e Serviços** > **Tela de permissão OAuth**.
2. Selecione o tipo de usuário: **Externo** (*External*) e clique em **Criar**.
3. Preencha os campos obrigatórios:
   - **Nome do app**: `Olivelas GDrive Sync`
   - **E-mail para suporte do usuário**: Seu e-mail
   - **Dados de contato do desenvolvedor**: Seu e-mail
4. Na etapa **Escopos** (*Scopes*), adicione o escopo do Google Drive:
   - `https://www.googleapis.com/auth/drive`
5. Na etapa **Usuários de teste** (*Test Users*):
   - **Muito Importante**: Adicione o seu endereço de e-mail do Gmail (ex: `projetos.olivelas@gmail.com`). Enquanto o app estiver em fase de testes, apenas contas cadastradas como usuárias de teste podem fazer login.
6. Clique em **Salvar e continuar**.

### 4. Criar as Credenciais OAuth 2.0
1. Acesse **APIs e Serviços** > **Credenciais**.
2. Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
3. Em *Tipo de aplicativo*, selecione: **Aplicativo da Web**.
4. Em *Nome*, coloque: `Olivelas GDrive Sync Web Client`.
5. Em **URIs de redirecionamento autorizados** (*Authorized redirect URIs*), clique em **+ Adicionar URI** e insira exatamente:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
   *(Atenção: certifique-se de que não haja barras extras no final ou espaços em branco).*
6. Clique em **Criar**.
7. Copie o **ID do cliente** (*Client ID*) e o **Segredo do cliente** (*Client Secret*).

### 5. Conectar na Aplicação
1. Abra a aplicação no navegador.
2. No menu lateral, acesse **Configurações do Drive**.
3. Cole o **Client ID** e o **Client Secret** nos respectivos campos.
4. Clique em **"Salvar e Conectar Conta Google"**.
5. Uma janela pop-up do Google abrirá: selecione sua conta, confirme as permissões e o sistema sincronizará automaticamente!

---

## ⚠️ Solução de Problemas Comuns no Google Drive

- **Erro 400: `redirect_uri_mismatch`**:
  - *Causa*: O URI configurado no Google Cloud Console não bate com o URI chamado pela aplicação.
  - *Solução*: Verifique em *Credenciais > ID do cliente OAuth* se o URI de redirecionamento autorizado é exatamente `http://localhost:3001/api/auth/google/callback`.
- **Erro 403: `access_denied` / App não verificado**:
  - *Causa*: Seu aplicativo está em modo de teste e o e-mail que você tentou autenticar não foi adicionado como usuário de teste.
  - *Solução*: Vá na aba **Tela de permissão OAuth** no Google Cloud Console e adicione seu e-mail na seção **Test Users (Usuários de Teste)**.
- **Erro 401: `invalid_client`**:
  - *Causa*: O Client ID ou o Client Secret foi copiado com espaços ou caracteres faltando.
  - *Solução*: Recopie as credenciais direto do Google Cloud Console sem espaços nas extremidades.
- **Erro 403: `Service Accounts do not have storage quota`**:
  - *Causa*: Tentativa de upload para drive pessoal `@gmail.com` usando Service Account.
  - *Solução*: Conecte usando o modo **OAuth 2.0**.

---

## 🚀 Instalação e Execução

### 1. Pré-requisitos
- **Node.js** (versão 18, 20 ou 22 recomendadas)
- **npm** (versão 9 ou superior)

### 2. Clonar e Instalar
```bash
# Clonar o repositório
git clone https://github.com/pycriador/olivelas-gdrive-sync.git
cd olivelas-gdrive-sync

# Instalar as dependências
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
*(Opcional: personalize a porta do servidor se desejar, o padrão é `3001`)*.

### 4. Executar em Modo de Desenvolvimento
Inicia simultaneamente o servidor backend (porta 3001) e o frontend Vite com hot reload (porta 5173):
```bash
npm run dev
```
Abra o navegador em: **`http://localhost:5173`**

### 5. Compilar e Executar em Produção
```bash
# Compilar TypeScript e empacotar Vite
npm run build

# Iniciar o servidor em produção
npm start
```
Abra o navegador em: **`http://localhost:3001`**

---

## 💻 Recursos da Interface

1. **Menu Lateral (Desktop)**:
   - Monitoramento do Drive com quota utilizada e total.
   - Navegação por status: Todas, Sincronizando, Ativas, Pausadas e Falha.
   - Acesso rápido a Notificações, Histórico de Arquivos e Configurações.
   - Indicador de Watchers ativos em background.
2. **Layout Mobile Responsivo**:
   - Barra superior com botão Hamburger.
   - Gaveta deslizante (*Drawer*) com fechamento por clique fora, botão `X` ou tecla `Esc`.
3. **Barra de Busca e Filtros Dinâmicos**:
   - Pesquisa rápida por nome, diretório local ou ID remoto.
   - Pílulas com contadores atualizados em tempo real.
   - Botão para resetar filtros ativos.
   - Paginação limpa com indicador `Exibindo X–Y de Z pastas`.
4. **Controles Operacionais**:
   - Sincronização manual por pasta ou em lote.
   - Botão de cancelamento (*Stop*) imediato em caso de emergência.
   - Pausar/Retomar monitoramento por pasta.

---

## 🔒 Segurança & Privacidade

Este projeto foi configurado com regras rigorosas de segurança:

- **Tokens e Credenciais Criptografados**: Os tokens de acesso e chaves de API nunca ficam expostos em texto plano; são criptografados com chave local antes de serem gravados no banco SQLite.
- **Proteção do Repositório (`.gitignore`)**:
  - Arquivos do banco de dados SQLite (`data/*.db*`, `*.wal`, `*.shm`) são **estritamente ignorados**.
  - Arquivos de credenciais (`credentials.json`, `client_secret*.json`, `.env`, tokens) estão bloqueados contra commits acidentais.
  - Apenas o arquivo `.gitkeep` da pasta `data/` é mantido para garantir a estrutura do diretório.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia backend e frontend concorrentemente para desenvolvimento |
| `npm run dev:server` | Inicia somente o servidor backend com reinicialização automática (`tsx watch`) |
| `npm run dev:client` | Inicia somente o frontend Vite |
| `npm run build` | Valida tipos com `tsc` e gera o build otimizado com `vite build` |
| `npm start` | Executa o servidor de produção servindo os assets estáticos |

---

## 📄 Licença

Distribuído sob a licença MIT. Desenvolvido por Olivelas.
