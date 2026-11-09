#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"

echo "=================================================================="
echo "🚀 Iniciando Olivelas All In (Hub Multi-Schema Supabase)"
echo "=================================================================="
echo "📂 Diretório : $PROJECT_DIR"
echo "🌐 Endereço  : http://localhost:${PORT}"
echo "🔐 Auth DB   : public.profiles (Login Unificado)"
echo "🗄️  Schemas   : 16 schemas dedicados no PostgreSQL (Supabase)"
echo "=================================================================="

if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências do projeto..."
  npm install
fi

exec npx vite --host "$HOST" --port "$PORT"
