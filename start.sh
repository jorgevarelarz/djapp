#!/bin/bash

echo "🚀 Iniciando DJ App (backend + frontend)…"

# 1) Backend
echo "▶️ Backend:"
cd backend
if [ ! -d "node_modules" ]; then
  echo "  📦 Instalando dependencias del backend…"
  npm install
fi
npm run dev &    # corre en background

# 2) Frontend
echo "▶️ Frontend:"
cd ..            # vuelve a dj-app
if [ ! -d "node_modules" ]; then
  echo "  📦 Instalando dependencias del frontend…"
  npm install
fi
npm run dev      # arranca Vite desde la raíz (donde está vite.config.js)

