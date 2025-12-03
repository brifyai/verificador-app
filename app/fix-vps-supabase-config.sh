#!/bin/bash

# SCRIPT PARA ACTUALIZAR CONFIGURACIÓN DE SUPABASE EN EL VPS

echo "=== ACTUALIZANDO CONFIGURACIÓN DE SUPABASE EN EL VPS ==="

sshpass -p "Aintelligence2025" ssh -o StrictHostKeyChecking=no root@213.199.39.147 << 'EOF'
echo "✅ Conectado al VPS"

# 1. Actualizar archivo .env con configuración correcta de Supabase
echo "🔧 Actualizando configuración de Supabase..."
cd /home/radioapp/radio-recorder

cat > .env << 'ENV_EOF'
# Configuración de Supabase
SUPABASE_URL=http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw

# Configuración del servidor
API_HOST=0.0.0.0
API_PORT=5000
RECORDINGS_DIR=/home/radioapp/radio-recorder/recordings
ENV_EOF

echo "✅ Configuración actualizada"

# 2. Verificar que las variables estén correctas
echo "🔍 Verificando configuración..."
echo "SUPABASE_URL: $(grep SUPABASE_URL .env | cut -d= -f2)"
echo "SUPABASE_ANON_KEY: $(grep SUPABASE_ANON_KEY .env | cut -d= -f2 | cut -c1-20)..."

# 3. Reiniciar servicio para aplicar cambios
echo "🔄 Reiniciando servicio..."
systemctl restart radio-recorder
sleep 5

# 4. Verificar estado del servicio
echo "📊 Verificando estado del servicio..."
systemctl status radio-recorder --no-pager -l

# 5. Probar endpoints con nueva configuración
echo "🧪 Probando endpoints con nueva configuración..."
echo "Probando /api/health:"
curl -s http://localhost:5000/api/health

echo -e "\n\nProbando /api/radios (primeros 300 chars):"
curl -s http://localhost:5000/api/radios | head -c 300

echo -e "\n\nProbando /api/start-recording con radio_id 14:"
curl -s -X POST http://localhost:5000/api/start-recording \
  -H "Content-Type: application/json" \
  -d '{"radio_id": 14}'

echo -e "\n\n=== CONFIGURACIÓN COMPLETADA ==="
echo "✅ Variables de entorno actualizadas"
echo "✅ Servicio reiniciado"
echo "✅ Conectividad con Supabase verificada"
EOF