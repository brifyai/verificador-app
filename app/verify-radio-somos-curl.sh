#!/bin/bash

# Script para verificar la radio de Somos Petorca usando curl
# ID de la radio: radio_mijm9y5h_hlfewbl

# Token de autenticación (versión corta)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMzAwNzI4NCwiZXhwIjoxNzMzNjEyMDg0fQ.8a2b"

echo "Verificando estado de radio Somos Petorca..."
echo "URL: http://localhost:3000/api/radios/radio_mijm9y5h_hlfewbl/verify"
echo "Token: ${TOKEN}"

# Realizar la petición con curl
curl -X POST "http://localhost:3000/api/radios/radio_mijm9y5h_hlfewbl/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -v

echo ""
echo "Verificación completada."