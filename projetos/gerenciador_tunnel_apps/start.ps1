<#
.SYNOPSIS
    Olivelas Local Tunnel - Script de Inicialização para Windows PowerShell
.DESCRIPTION
    Verifica dependências, instala pacotes caso necessário e inicia o servidor.
.EXAMPLE
    .\start.ps1
    .\start.ps1 -Prod
    .\start.ps1 -Build
    .\start.ps1 -NoBrowser
#>

param (
    [switch]$Prod,
    [switch]$Build,
    [switch]$Desktop,
    [switch]$DesktopDev,
    [switch]$BuildDesktop,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "   🌐 Olivelas Local Tunnel & App Runner (PowerShell)" -ForegroundColor White
Write-Host "==============================================================" -ForegroundColor Cyan

# 1. Verifica Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não encontrado no sistema. Instale o Node.js 18+." -ForegroundColor Red
    exit 1
}
$nodeVersion = & node -v
Write-Host "✔ Node.js detectado: $nodeVersion" -ForegroundColor Green

# 2. Verifica Cloudflared e Ngrok
if (Get-Command "cloudflared" -ErrorAction SilentlyContinue) {
    Write-Host "✔ Cloudflared detectado no PATH" -ForegroundColor Green
} else {
    Write-Host "⚠ Cloudflared não encontrado no PATH (opcional)" -ForegroundColor Yellow
}

if (Get-Command "ngrok" -ErrorAction SilentlyContinue) {
    Write-Host "✔ Ngrok detectado no PATH" -ForegroundColor Green
} else {
    Write-Host "⚠ Ngrok não encontrado no PATH (opcional)" -ForegroundColor Yellow
}

# 3. Cria .env se não existir
if ((-not (Test-Path ".env")) -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✔ Arquivo .env criado a partir de .env.example" -ForegroundColor Green
}

if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# 4. Instala node_modules se não existir
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Instalando dependências (npm install)..." -ForegroundColor Cyan
    & npm install
}

Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan

if ($Desktop) {
    Write-Host "🖥️ Iniciando aplicação Desktop via ElectronJS..." -ForegroundColor Green
    & npm run electron:start
} elseif ($DesktopDev) {
    Write-Host "🖥️ Iniciando aplicação Desktop ElectronJS (Modo Dev HMR)..." -ForegroundColor Green
    & npm run electron:dev
} elseif ($BuildDesktop) {
    Write-Host "📦 Gerando executáveis Windows (.exe) com Electron Builder..." -ForegroundColor Cyan
    & npm run electron:build:win
} elseif ($Prod -or $Build) {
    if ($Build -or (-not (Test-Path "dist/index.html"))) {
        Write-Host "🔨 Compilando projeto para produção (npm run build)..." -ForegroundColor Cyan
        & npm run build
    }
    $url = "http://localhost:3002"
    Write-Host "🚀 Iniciando em modo PRODUÇÃO em: $url" -ForegroundColor Green
    if (-not $NoBrowser) {
        Start-Process powershell -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"Start-Sleep -Seconds 2; Start-Process '$url'`""
    }
    & npm start
} else {
    $url = "http://localhost:5174"
    Write-Host "🚀 Iniciando em modo DESENVOLVIMENTO:" -ForegroundColor Green
    Write-Host "   • Painel Web (Vite): $url" -ForegroundColor White
    Write-Host "   • Servidor API/SSE : http://localhost:3002" -ForegroundColor White
    Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan
    if (-not $NoBrowser) {
        Start-Process powershell -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"Start-Sleep -Seconds 3; Start-Process '$url'`""
    }
    & npm run dev
}
