#!/bin/bash

# Script para matar todos los servidores y liberar el puerto 5000

set -e

echo "========================================"
echo "MATANDO TODOS LOS SERVIDORES - LIBERAR PUERTO 5000"
echo "========================================"
echo ""

echo "PASO 1: VERIFICAR QUÉ ESTÁ CORRIENDO EN PUERTO 5000"
echo "========================================"
netstat -tlnp | grep :5000
echo ""

echo "PASO 2: MATAR TODOS LOS PROCESOS NODE"
echo "========================================"
pkill -f "node"
echo "✅ Procesos node terminados"
echo ""

echo "PASO 3: MATAR PROCESOS ESPECÍFICOS DEL PUERTO 5000"
echo "========================================"
sudo fuser -k 5000/tcp 2>/dev/null || echo "No hay procesos en puerto 5000"
echo "✅ Procesos en puerto 5000 terminados"
echo ""

echo "PASO 4: MATAR SERVICIO DE GRABACIÓN SI ESTÁ ACTIVO"
echo "========================================"
systemctl stop radio-recording-organized.service 2>/dev/null || echo "Servicio no estaba corriendo"
systemctl stop radio-recording.service 2>/dev/null || echo "Servicio antiguo no estaba corriendo"
echo "✅ Servicios detenidos"
echo ""

echo "PASO 5: MATAR NGINX/APACHE SI ESTÁN USANDO PUERTO 5000"
echo "========================================"
sudo systemctl stop nginx 2>/dev/null || echo "Nginx no estaba corriendo"
sudo systemctl stop apache2 2>/dev/null || echo "Apache2 no estaba corriendo"
sudo systemctl stop httpd 2>/dev/null || echo "Httpd no estaba corriendo"
echo "✅ Servidores web detenidos"
echo ""

echo "PASO 6: ESPERAR 3 SEGUNDOS Y VERIFICAR"
echo "========================================"
sleep 3
echo "Verificando que el puerto esté libre:"
netstat -tlnp | grep :5000 || echo "✅ Puerto 5000 está libre"
echo ""

echo "PASO 7: LIMPIAR PROCESOS ZOMBIE"
echo "========================================"
sudo pkill -9 -f "node" 2>/dev/null || echo "No hay procesos zombie"
echo "✅ Limpieza completada"
echo ""

echo "PASO 8: VERIFICAR ESTADO FINAL"
echo "========================================"
echo "Puertos en uso:"
netstat -tlnp | grep :500 || echo "✅ No hay procesos en puertos 500x"
echo ""
echo "Procesos node activos:"
ps aux | grep node | grep -v grep || echo "✅ No hay procesos node activos"
echo ""

echo "========================================"
echo "✅ PUERTO 5000 LIBERADO"
echo "========================================"
echo ""

echo "AHORA PUEDES INICIAR TU SERVIDOR:"
echo "========================================"
echo "cd /home/radioapp/radio-recorder/app"
echo "sudo -u radioapp node server-vps-organized-correct-path.js"
echo ""

echo "O REINICIAR EL SERVICIO:"
echo "========================================"
echo "systemctl start radio-recording-organized.service"
echo "systemctl status radio-recording-organized.service"
echo ""

echo "Y PROBAR EL ENDPOINT:"
echo "========================================"
echo "curl http://localhost:5000/health"
echo ""