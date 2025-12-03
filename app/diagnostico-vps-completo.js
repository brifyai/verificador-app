#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DEL VPS
 * Identifica qué está realmente instalado y funcionando
 */

function mostrarDiagnosticoVPS() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL VPS');
    console.log('=' .repeat(60));
    
    console.log('\n📋 COMANDOS PARA EJECUTAR EN EL VPS:');
    
    console.log('\n1️⃣ VERIFICAR PROCESOS DE GRABACIÓN:');
    console.log('   ps aux | grep -i record');
    console.log('   ps aux | grep -i ffmpeg');
    console.log('   ps aux | grep -i radio');
    
    console.log('\n2️⃣ VERIFICAR SERVICIOS ACTIVOS:');
    console.log('   systemctl list-units --type=service --all');
    console.log('   systemctl list-units --type=service | grep -i record');
    console.log('   systemctl list-units --type=service | grep -i radio');
    
    console.log('\n3️⃣ VERIFICAR APLICACIONES INSTALADAS:');
    console.log('   which ffmpeg');
    console.log('   ffmpeg -version');
    console.log('   which node');
    console.log('   node --version');
    
    console.log('\n4️⃣ VERIFICAR PUERTOS ACTIVOS:');
    console.log('   netstat -tulpn | grep :5000');
    console.log('   netstat -tulpn | grep :3000');
    console.log('   ss -tulpn | grep :5000');
    
    console.log('\n5️⃣ VERIFICAR DIRECTORIOS:');
    console.log('   ls -la /opt/');
    console.log('   ls -la /usr/local/bin/ | grep -i record');
    console.log('   find / -name "*recording*" 2>/dev/null');
    console.log('   find / -name "*radio*" -type f 2>/dev/null');
    
    console.log('\n6️⃣ VERIFICAR LOGS DEL SISTEMA:');
    console.log('   journalctl --since "1 hour ago" | grep -i record');
    console.log('   journalctl --since "1 hour ago" | grep -i ffmpeg');
    console.log('   tail -f /var/log/syslog | grep -i record');
    
    console.log('\n7️⃣ VERIFICAR CONFIGURACIÓN DE RED:');
    console.log('   curl -I http://localhost:5000/health');
    console.log('   curl -I http://localhost:5000/api/recordings');
    console.log('   curl -I http://localhost:5000/api/active-recordings');
    
    console.log('\n8️⃣ VERIFICAR ESPACIO Y PERMISOS:');
    console.log('   df -h');
    console.log('   ls -la /tmp/ | grep recording');
    console.log('   ls -la /var/log/ | grep recording');
    
    console.log('\n🎯 POSIBLES ESCENARIOS:');
    console.log('   A) Servicio nunca instalado → Instalar desde cero');
    console.log('   B) Servicio instalado pero no iniciado → Iniciar servicio');
    console.log('   C) Servicio instalado pero con errores → Revisar logs');
    console.log('   D) FFmpeg no instalado → Instalar FFmpeg');
    console.log('   E) Puerto 5000 no abierto → Abrir puerto');
    
    console.log('\n📋 RESULTADOS ESPERADOS:');
    console.log('   ✅ Si encuentra procesos de grabación → Servicio activo');
    console.log('   ✅ Si FFmpeg está instalado → Herramienta disponible');
    console.log('   ✅ Si puerto 5000 responde → API funcionando');
    console.log('   ❌ Si nada de lo anterior → Servicio no instalado');
    
    console.log('\n🛠️ SIGUIENTE PASO:');
    console.log('   Ejecutar estos comandos y enviarme los resultados');
    console.log('   para determinar la solución exacta.');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 DIAGNÓSTICO LISTO PARA EJECUTAR');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    mostrarDiagnosticoVPS();
}

module.exports = { mostrarDiagnosticoVPS };