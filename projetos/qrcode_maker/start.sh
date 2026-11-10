#!/usr/bin/env bash
# Olivelas QR Code Studio - Inicializador Linux & macOS (TypeScript)

set -e

echo "==================================================="
echo "   Olivelas QR Code Studio - TypeScript 2.0        "
echo "==================================================="
echo ""

open_browser() {
  local url="$1"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 &
  else
    echo "Abra no seu navegador: $url"
  fi
}

if command -v npm >/dev/null 2>&1; then
  echo "[OK] Node/npm detectado. Iniciando servidor Vite..."
  open_browser "http://localhost:3000"
  npm run dev
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  echo "[OK] Python 3 detectado. Servindo pasta dist em http://localhost:8000..."
  open_browser "http://localhost:8000"
  cd dist && python3 -m http.server 8000
  exit 0
fi

if command -v python >/dev/null 2>&1; then
  echo "[OK] Python detectado. Servindo pasta dist em http://localhost:8000..."
  open_browser "http://localhost:8000"
  cd dist && python -m http.server 8000
  exit 0
fi

echo "[INFO] Abrindo dist/index.html diretamente no navegador..."
open_browser "./dist/index.html"
