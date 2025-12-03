#!/bin/bash

# Script para depurar el servidor y ver el error exacto

set -e

echo "========================================"
echo "DEPURACIÓN DEL SERVIDOR - VER ERROR EXACTO"
echo "========================================"
echo ""

# Ir al directorio correcto
cd /home/radioapp/radio-recorder/app

echo "📁 Directorio actual: $(pwd)"
echo ""

# Verificar archivos
echo "📋 Verificando archivos:"
ls -la
echo ""

# Verificar contenido del archivo del servidor (primeras líneas)
echo "🔍 Primeras líneas del servidor:"
head -10 server-vps-organized-correct-path.js
echo ""

# Verificar si dotenv está cargado
echo "📦 Verificando si dotenv está en el servidor:"
if grep -q "require('dotenv')" server-vps-organized-correct-path.js; then
    echo "✅ dotenv está cargado"
else
    echo "❌ dotenv NO está cargado"
fi
echo ""

# Verificar variables de entorno
echo "🔧 Variables de entorno:"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "NODE_ENV: $NODE_ENV"
echo ""

# Cargar dotenv manualmente y verificar
echo "🔌 Cargando dotenv manualmente:"
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL); console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'OK' : 'NOT SET');"
echo ""

# Probar sintaxis del archivo
echo "🧪 Verificando sintaxis del archivo:"
node -c server-vps-organized-correct-path.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxis correcta"
else
    echo "❌ Error de sintaxis"
fi
echo ""

# Ejecutar el servidor con verbose
echo "🚀 Ejecutando servidor con verbose (mostrará el error):"
echo "====================================="

# Ejecutar como usuario radioapp para simular el servicio
sudo -u radioapp bash -c "cd /home/radioapp/radio-recorder/app && node --trace-warnings server-vps-organized-correct-path.js"

echo "====================================="
echo ""

# Si llegamos aquí, el proceso terminó sin mostrar error
echo "⚠️ El proceso terminó sin mostrar error visible"
echo ""

# Intentar con más debug
echo "🔍 Intentando con más información de debug:"
sudo -u radioapp bash -c "cd /home/radioapp/radio-recorder/app && node --trace-warnings --trace-deprecation --throw-deprecation server-vps-organized-correct-path.js"

echo ""
echo "========================================"
echo "DEPURACIÓN COMPLETADA"
echo "========================================"