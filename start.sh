#!/bin/bash
set -e

echo "==================================="
echo "  CRM Advocacia - Iniciando..."
echo "==================================="

# Verifica Node.js
if ! command -v node &> /dev/null; then
  echo "ERRO: Node.js não encontrado. Instale em https://nodejs.org"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Instala dependências se necessário
if [ ! -d "backend/node_modules" ]; then
  echo "Instalando dependências do backend..."
  cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Instalando dependências do frontend..."
  cd frontend && npm install && cd ..
fi

echo ""
echo "Iniciando backend (porta 3001)..."
cd backend && node server.js &
BACKEND_PID=$!

sleep 1

echo "Iniciando frontend (porta 5173)..."
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================="
echo "  CRM rodando!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "==================================="
echo ""
echo "Pressione Ctrl+C para parar."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
