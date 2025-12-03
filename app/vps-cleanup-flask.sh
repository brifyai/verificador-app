#!/bin/bash

# =============================================================================
# SCRIPT DE LIMPIEZA ULTRA SIMPLE - FLASK APP.PY
# =============================================================================
# Este script SOLO elimina el código erróneo de flask/app.py
# NO modifica nada más

echo "🧹 LIMPIANDO ARCHIVO FLASK APP.PY"
echo "============================================================"

FLASK_APP="/home/radioapp/radio-recorder/venv/lib/python3.12/site-packages/flask/app.py"

if [ ! -f "$FLASK_APP" ]; then
    echo "❌ Archivo no encontrado: $FLASK_APP"
    exit 1
fi

echo "📄 Archivo encontrado: $FLASK_APP"

# Buscar si existe el endpoint erróneo
if grep -q "@app.route('/api/recordings'" "$FLASK_APP"; then
    echo "⚠️  Encontrado endpoint erróneo, eliminando..."
    
    # Encontrar el número de línea exacto
    LINE_NUM=$(grep -n "@app.route('/api/recordings'" "$FLASK_APP" | cut -d: -f1)
    
    if [ ! -z "$LINE_NUM" ]; then
        # Crear backup primero
        cp "$FLASK_APP" "$FLASK_APP.backup.before_cleanup"
        echo "✅ Backup creado: $FLASK_APP.backup.before_cleanup"
        
        # Eliminar exactamente 22 líneas (el endpoint completo que agregamos)
        sed -i "${LINE_NUM},$((LINE_NUM + 21))d" "$FLASK_APP"
        
        echo "✅ Endpoint erróneo eliminado"
    else
        echo "❌ No se pudo encontrar la línea exacta"
        exit 1
    fi
else
    echo "✅ No se encontró endpoint erróneo, nada que limpiar"
fi

echo ""
echo "✅ LIMPIEZA COMPLETADA"
echo "============================================================"
echo "El servicio debería iniciar correctamente ahora."
echo "Verifica con: systemctl status radio-recorder.service"