@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ==============================================================================
:: Olivelas Local Tunnel - Script de Inicialização (Windows CMD / Duplo Clique)
:: Uso:
::   start.bat          -> Inicia em modo Desenvolvimento (Vite 5174 + API 3002)
::   start.bat --prod   -> Compila e inicia em Produção (Porta 3002)
::   start.bat --build  -> Força recompilação e inicia em Produção
:: ==============================================================================

title Olivelas Local Tunnel ^& App Runner

:: Entra na pasta onde o script está localizado
cd /d "%~dp0"

set "MODE=dev"
set "FORCE_BUILD=0"
set "OPEN_BROWSER=1"

:parse_args
if "%~1"=="" goto after_args
if /i "%~1"=="--prod" set "MODE=prod"
if /i "%~1"=="-p" set "MODE=prod"
if /i "%~1"=="--desktop" set "MODE=desktop"
if /i "%~1"=="--electron" set "MODE=desktop"
if /i "%~1"=="-d" set "MODE=desktop"
if /i "%~1"=="--desktop-dev" set "MODE=desktop-dev"
if /i "%~1"=="--build-desktop" set "MODE=build-desktop"
if /i "%~1"=="--build" (
    set "MODE=prod"
    set "FORCE_BUILD=1"
)
if /i "%~1"=="--no-open" set "OPEN_BROWSER=0"
shift
goto parse_args
:after_args

echo ==============================================================
echo    Olivelas Local Tunnel ^& App Runner (Windows)
echo ==============================================================

:: 1. Verifica Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado no PATH.
    echo Instale o Node.js 18+ em https://nodejs.org/ e tente novamente.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js detectado: %NODE_VER%

:: 2. Verifica Cloudflared e Ngrok
where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Cloudflared detectado no PATH.
) else (
    echo [AVISO] Cloudflared nao encontrado no PATH ^(opcional^).
)

where ngrok >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Ngrok detectado no PATH.
) else (
    echo [AVISO] Ngrok nao encontrado no PATH ^(opcional^).
)

:: 3. Cria .env se não existir
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado a partir de .env.example
    )
)

:: Garante pasta data\
if not exist "data" mkdir "data"

:: 4. Instala dependências se node_modules não existir
if not exist "node_modules" (
    echo.
    echo [INFO] Instalando dependencias do projeto ^(npm install^)...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERRO] Falha ao instalar dependencias com npm install.
        pause
        exit /b 1
    )
)

echo --------------------------------------------------------------

if /i "%MODE%"=="desktop" (
    echo [INFO] Iniciando aplicacao Desktop via ElectronJS...
    call npm run electron:start
) else if /i "%MODE%"=="desktop-dev" (
    echo [INFO] Iniciando aplicacao Desktop ElectronJS ^(Modo Dev HMR^)...
    call npm run electron:dev
) else if /i "%MODE%"=="build-desktop" (
    echo [INFO] Gerando instalador Windows .exe com Electron Builder...
    call npm run electron:build:win
) else if /i "%MODE%"=="prod" (
    if "%FORCE_BUILD%"=="1" (
        echo [INFO] Compilando aplicacao para producao ^(npm run build^)...
        call npm run build
    ) else if not exist "dist\index.html" (
        echo [INFO] Compilando aplicacao para producao ^(npm run build^)...
        call npm run build
    )
    echo [INFO] Iniciando em modo PRODUCAO em: http://localhost:3002
    if "%OPEN_BROWSER%"=="1" (
        start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3002"
    )
    call npm start
) else (
    echo [INFO] Iniciando em modo DESENVOLVIMENTO:
    echo   - Painel Web ^(Vite^): http://localhost:5174
    echo   - Servidor API/SSE : http://localhost:3002
    echo --------------------------------------------------------------
    if "%OPEN_BROWSER%"=="1" (
        start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5174"
    )
    call npm run dev
)

pause
