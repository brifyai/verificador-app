#!/bin/bash

# Script para verificar radios usando curl con autenticación JWT
# Uso: ./test-radio-verification.sh <radio_id>

RADIO_ID=${1:-"radio_mijm9y5h_hlfewbl"}  # ID por defecto: Somos Petorca
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/radios-direct/${RADIO_ID}/verify"

# Token JWT válido (generado con generate-valid-token.js)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY0NTYwNDM1LCJleHAiOjE3NjUxNjUyMzV9.2i5S23WMGKa85c2ESMusNKJ8VaYVPtLZ0tkJV2f-kL0"

echo "=== Verificación de Radio ==="
echo "Radio ID: $RADIO_ID"
echo "URL: ${BASE_URL}${API_ENDPOINT}"
echo "Fecha: $(date)"
echo ""

# Realizar la petición con curl
echo "Realizando petición..."
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -w "\n\n=== Información de la respuesta ===\nHTTP Status: %{http_code}\nTiempo total: %{time_total}s\nTamaño: %{size_download} bytes\n" \
  -s -v 2>&1 | grep -E "(>|{|}|\[|HTTP|Tiempo|Tamaño)"

echo ""
echo "=== Fin de la verificación ==="