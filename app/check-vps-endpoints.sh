#!/bin/bash

# SCRIPT PARA VERIFICAR QUÉ ENDPOINTS TIENE EL VPS

echo "=== VERIFICANDO ENDPOINTS DEL VPS ==="

sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

# 1. Verificar qué endpoints están disponibles
echo "🔍 Verificando endpoints disponibles..."
echo "Probando /api/health:"
curl -s http://localhost:5000/api/health

echo -e "\n\nProbando /api/radios:"
curl -s http://localhost:5000/api/radios | head -c 100

echo -e "\n\nProbando /api/start-recording:"
curl -s -X POST http://localhost:5000/api/start-recording \
  -H "Content-Type: application/json" \
  -d '{"radio_id": 14}' | head -c 100

echo -e "\n\nProbando /api/active-recordings (el que falla):"
curl -s http://localhost:5000/api/active-recordings

echo -e "\n\nProbando /api/stop-recording:"
curl -s -X POST http://localhost:5000/api/stop-recording \
  -H "Content-Type: application/json" \
  -d '{"radio_id": 14}' | head -c 100

echo -e "\n\nProbando /api/recordings:"
curl -s http://localhost:5000/api/recordings | head -c 100

echo -e "\n\n=== VERIFICANDO CÓDIGO FUENTE ==="
echo "Verificando qué endpoints están definidos en el código:"
grep -n "route.*methods" /home/radioapp/radio-recorder/scripts/api_server.py

echo -e "\n=== DIAGNÓSTICO COMPLETADO ==="
EOF