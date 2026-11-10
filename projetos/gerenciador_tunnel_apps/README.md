# Olivelas Local Tunnel & App Runner

Painel full-stack (Web & Desktop ElectronJS) inspirado na arquitetura e design do **Olivelas GDrive Sync**, desenvolvido para:
1. **Exportar aplicações locais para a internet** usando **Cloudflared Tunnel** (`*.trycloudflare.com` ou Zero Trust), **Ngrok** (`*.ngrok-free.app`), **LocalTunnel** ou **SSH (`localhost.run`)**, capturando e apresentando automaticamente a URL pública gerada, QR Code e atalhos de compartilhamento.
2. **Gerenciar e executar qualquer aplicação local** (Node.js, Python, Vite, PHP, Docker, scripts `.sh`/`.bat`, servidores estáticos) diretamente pela interface, capturando automaticamente **todas as URLs anunciadas nos logs** (Frontend, Backend, API, Swagger, Health, Rede Local LAN e Túnel Público) e permitindo ligar/desligar ou alternar a porta do túnel público a qualquer momento com 1 clique.

---

## Como iniciar em cada modo

### 1. Modo Web Tradicional (Navegador)
```bash
./start.sh          # Modo Desenvolvimento (http://localhost:5174)
./start.sh --prod   # Modo Produção (http://localhost:3002)
```

### 2. Modo Desktop ElectronJS (Janela Nativa + Bandeja do Sistema)
```bash
./start.sh --desktop       # Compila e abre a aplicação Desktop completa
./start.sh --desktop-dev   # Abre o Electron com Hot-Reload (Vite + Electron)
# Ou via npm:
npm run electron:start
```

### 3. Gerar Executáveis Instaláveis (`release/`)
```bash
./start.sh --build-desktop
# Ou por plataforma específica:
npm run electron:build:linux
npm run electron:build:win
npm run electron:build:mac
```

---

## Comandos no Windows (CMD / Duplo Clique ou PowerShell)

Basta dar **duplo clique** em `start.bat` ou executar no terminal:
```bat
:: 1. Modo Web Tradicional
start.bat
start.bat --prod

:: 2. Modo Desktop ElectronJS
start.bat --desktop
start.bat --desktop-dev

:: 3. Gerar Executável Instalável Windows (.exe)
start.bat --build-desktop
```

Ou via **PowerShell**:
```powershell
.\start.ps1           # Modo Web (Desenvolvimento)
.\start.ps1 -Prod     # Modo Web (Produção)
.\start.ps1 -Desktop  # Modo Desktop ElectronJS
.\start.ps1 -BuildDesktop # Gerar instalador .exe na pasta release/
```

---

## Resumo de Scripts NPM
```bash
# Instalar dependências
npm install

# Web (Desenvolvimento: Backend 3002 + Frontend Vite 5174)
npm run dev

# Web (Produção: Compila tudo e inicia na porta 3002)
npm run build
npm start

# Desktop Electron (Iniciar janela nativa diretamente)
npm run electron:start
npm run electron:dev
```

> **CI/CD Multiplataforma**: O repositório inclui o workflow `.github/workflows/build-desktop.yml` para compilar automaticamente os instaladores nativos de **Linux (`.AppImage`, `.deb`), Windows (`.exe`) e macOS (`.dmg`, `.zip`)** no GitHub Actions.
