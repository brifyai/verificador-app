#!/bin/bash

# SCRIPT PARA PROBAR CONECTIVIDAD DESDE LA APLICACIÓN AL VPS

echo "=== PROBANDO CONECTIVIDAD DESDE LA APLICACIÓN ==="

# Probar desde la aplicación local al VPS
echo "🔍 Probando conectividad desde localhost:3000 al VPS..."
echo "Probando /api/active-recordings desde la aplicación:"

# Hacer la misma llamada que hace la aplicación
curl -s -X GET "http://213.199.39.147:5000/api/active-recordings" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type" \
  -v

echo -e "\n\n🔍 Probando /api/health con CORS:"
curl -s -X GET "http://213.199.39.147:5000/api/health" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

echo -e "\n\n🔍 Verificando si hay problemas de CORS en el VPS:"
sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

echo "🔍 Verificando configuración CORS en el código:"
grep -A 5 -B 5 "CORS" /home/radioapp/radio-recorder/scripts/api_server.py

echo -e "\n🔍 Verificando headers de respuesta:"
echo "Probando con curl verbose:"
curl -v http://localhost:5000/api/active-recordings 2>&1 | grep -E "(HTTP|Access-Control|Origin)"

echo -e "\n🔍 Verificando logs del servicio para requests:"
journalctl -u radio-recorder --since "2 minutes ago" --no-pager | tail -10
EOF

echo -e "\n\n=== DIAGNÓSTICO DE CONECTIVIDAD COMPLETADO ==="
echo "Si ves errores CORS, el problema está en la configuración del VPS"
echo "Si ves errores de conexión, el problema está en la red"
echo "Si todo funciona, el problema podría ser cache del navegador"