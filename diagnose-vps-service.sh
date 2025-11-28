#!/bin/bash

echo "🔍 DIAGNÓSTICO DEL SERVICIO DE GRABACIÓN EN VPS"
echo "==============================================="
echo ""

# Verificar todos los servicios que contienen 'radio' o 'record'
echo "📋 Buscando servicios relacionados con radio/grabación:"
systemctl list-units --type=service --state=active,running | grep -E 'radio|record|flask|api' || echo "No se encontraron servicios activos con esos nombres"

echo ""
echo "📋 Buscando TODOS los servicios:"
systemctl list-units --type=service --all | grep -E 'radio|record' || echo "No se encontraron servicios con esos nombres"

echo ""
echo "🔍 Verificando si existe el archivo de servicio:"
ls -la /etc/systemd/system/radio-recorder.service 2>/dev/null || echo "❌ /etc/systemd/system/radio-recorder.service NO EXISTE"

echo ""
echo "🔍 Buscando archivos de servicio en /etc/systemd/system/:"
find /etc/systemd/system/ -name "*radio*" -o -name "*record*" 2>/dev/null || echo "No se encontraron archivos de servicio"

echo ""
echo "🔍 Buscando procesos Python en ejecución:"
ps aux | grep python | grep -v grep

echo ""
echo "🔍 Buscando procesos en el puerto 5000:"
ss -tuln | grep 5000 || netstat -tuln | grep 5000 || echo "Puerto 5000 no está en escucha"

echo ""
echo "🔍 Verificando si el script api_server.py está corriendo:"
ps aux | grep api_server | grep -v grep

echo ""
echo "🔍 Verificando directorio del proyecto:"
ls -la /home/radioapp/radio-recorder/scripts/

echo ""
echo "==============================================="
echo "💡 Si el servicio no existe, prueba estos comandos:"
echo "cd /home/radioapp/radio-recorder && python3 scripts/api_server.py &"
echo "o"
echo "cd /home/radioapp/radio-recorder && nohup python3 scripts/api_server.py > server.log 2>&1 &"
echo ""
echo "💡 Para crear el servicio systemd, ejecuta:"
echo "sudo nano /etc/systemd/system/radio-recorder.service"