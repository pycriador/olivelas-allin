@echo off
setlocal
title Olivelas QR Code Studio (TypeScript)
echo ===================================================
echo   Olivelas QR Code Studio - TypeScript 2.0
echo ===================================================
echo.

where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node/npm detectado. Iniciando servidor Vite com TypeScript...
    start "" http://localhost:3000
    call npm run dev
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python detectado. Iniciando servidor local na pasta dist em http://localhost:8000...
    start "" http://localhost:8000
    cd dist
    python -m http.server 8000
    goto end
)

echo [INFO] Abrindo versao de producao diretamente no navegador...
start "" dist\index.html

:end
endlocal
