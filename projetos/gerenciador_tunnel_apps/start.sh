#!/usr/bin/env bash
# ==============================================================================
# Olivelas Local Tunnel - Script de Inicialização (Linux / macOS)
# Uso:
#   ./start.sh                 -> Inicia Web em modo Desenvolvimento (Vite 5174 + API 3002)
#   ./start.sh --prod          -> Compila (se necessário) e inicia Web em Produção (Porta 3002)
#   ./start.sh --desktop       -> Inicia a Aplicação Desktop Nativa via ElectronJS
#   ./start.sh --desktop-dev   -> Inicia ElectronJS com Hot-Reload (Vite + Electron)
#   ./start.sh --build-desktop -> Gera os executáveis desktop na pasta release/
#   ./start.sh --no-open       -> Não abre o navegador automaticamente
# ==============================================================================

set -e

# Garante execução a partir da pasta raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cores ANSI
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

MODE="dev"
FORCE_BUILD=false
OPEN_BROWSER=true

for arg in "$@"; do
  case "$arg" in
    --prod|-p)
      MODE="prod"
      ;;
    --build|-b)
      MODE="prod"
      FORCE_BUILD=true
      ;;
    --desktop|--electron|-d|-e)
      MODE="desktop"
      ;;
    --desktop-dev)
      MODE="desktop-dev"
      ;;
    --build-desktop)
      MODE="build-desktop"
      ;;
    --no-open|-n)
      OPEN_BROWSER=false
      ;;
  esac
done

echo -e "${CYAN}==============================================================${NC}"
echo -e "${BOLD}   🌐 Olivelas Local Tunnel & App Runner (Linux/macOS)${NC}"
echo -e "${CYAN}==============================================================${NC}"

# 1. Verifica Node.js e NPM
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERRO] Node.js não encontrado no sistema. Instale o Node.js 18+ para continuar.${NC}"
  exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✔ Node.js detectado:${NC} $NODE_VER"

# 2. Verifica binários opcionais de túnel (Cloudflared / Ngrok)
if command -v cloudflared >/dev/null 2>&1; then
  CF_VER=$(cloudflared --version 2>&1 | head -n 1)
  echo -e "${GREEN}✔ Cloudflared detectado:${NC} $CF_VER"
else
  echo -e "${YELLOW}⚠ Cloudflared não encontrado no PATH (opcional).${NC}"
fi

if command -v ngrok >/dev/null 2>&1; then
  NG_VER=$(ngrok version 2>&1 | head -n 1)
  echo -e "${GREEN}✔ Ngrok detectado:${NC} $NG_VER"
else
  echo -e "${YELLOW}⚠ Ngrok não encontrado no PATH (opcional).${NC}"
fi

# 3. Cria .env a partir do .env.example se não existir
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo -e "${GREEN}✔ Arquivo .env criado a partir de .env.example${NC}"
fi

# Garante pasta data/
mkdir -p data

# 4. Instala dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
  echo -e "\n${CYAN}📦 Instalando dependências do projeto (npm install)...${NC}"
  npm install
fi

# Carrega porta do .env (padrão 3002)
PORT=3002
if [ -f ".env" ]; then
  ENV_PORT=$(grep -E '^PORT=' .env | cut -d '=' -f2 | tr -d '[:space:]')
  if [ -n "$ENV_PORT" ]; then
    PORT="$ENV_PORT"
  fi
fi

# Função para abrir o navegador em segundo plano
open_url_async() {
  local target_url="$1"
  if [ "$OPEN_BROWSER" = true ]; then
    (
      sleep 2
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$target_url" >/dev/null 2>&1 || true
      elif command -v open >/dev/null 2>&1; then
        open "$target_url" >/dev/null 2>&1 || true
      fi
    ) &
  fi
}

echo -e "${CYAN}--------------------------------------------------------------${NC}"

if [ "$MODE" = "desktop" ]; then
  echo -e "${GREEN}🖥️  Iniciando aplicação Desktop via ElectronJS...${NC}"
  npm run electron:start
elif [ "$MODE" = "desktop-dev" ]; then
  echo -e "${GREEN}🖥️  Iniciando aplicação Desktop ElectronJS (Modo Dev HMR)...${NC}"
  npm run electron:dev
elif [ "$MODE" = "build-desktop" ]; then
  echo -e "${CYAN}📦 Gerando executáveis Desktop com Electron Builder...${NC}"
  npm run electron:build
elif [ "$MODE" = "prod" ]; then
  if [ "$FORCE_BUILD" = true ] || [ ! -d "dist" ]; then
    echo -e "${CYAN}🔨 Compilando aplicação para produção (npm run build)...${NC}"
    npm run build
  fi
  TARGET_URL="http://localhost:${PORT}"
  echo -e "${GREEN}🚀 Iniciando em modo PRODUÇÃO em: ${BOLD}${TARGET_URL}${NC}"
  open_url_async "$TARGET_URL"
  npm start
else
  TARGET_URL="http://localhost:5174"
  echo -e "${GREEN}🚀 Iniciando em modo DESENVOLVIMENTO:${NC}"
  echo -e "   • Painel Web (Vite): ${BOLD}${TARGET_URL}${NC}"
  echo -e "   • Servidor API/SSE : ${BOLD}http://localhost:${PORT}${NC}"
  echo -e "${CYAN}--------------------------------------------------------------${NC}"
  open_url_async "$TARGET_URL"
  npm run dev
fi
