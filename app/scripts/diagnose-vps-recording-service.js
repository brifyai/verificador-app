#!/usr/bin/env node

/**
 * Script para diagnosticar el servicio de grabación en el VPS
 * 
 * Busca:
 * 1. Scripts de grabación en /home/radioapp
 * 2. Servicios systemd relacionados
 * 3. Cron jobs
 * 4. Procesos en ejecución
 * 5. Logs del sistema
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';

console.log('🔍 DIAGNÓSTICO DEL SERVICIO DE GRABACIÓN EN VPS');
console.log('==============================================\n');

async function diagnoseVPSService() {
  console.log('🖥️  CONECTANDO AL VPS...\n');
  
  // Comandos a ejecutar en el VPS
  const commands = [
    {
      name: '1️⃣ VERIFICAR DIRECTORIO DE GRABACIONES',
      cmd: `ls -la /home/radioapp/radio-recorder/recordings/ | head -30`
    },
    {
      name: '2️⃣ BUSCAR SCRIPTS DE GRABACIÓN',
      cmd: `find /home/radioapp -name "*.py" -o -name "*.js" -o -name "*.sh" | grep -i -E "(record|radio|audio|stream)" | head -20`
    },
    {
      name: '3️⃣ VERIFICAR SERVICIOS SYSTEMD',
      cmd: `systemctl list-units --type=service --state=active | grep -i -E "(radio|record|audio|stream)"`
    },
    {
      name: '4️⃣ VERIFICAR CRON JOBS DEL USUARIO',
      cmd: `crontab -l 2>/dev/null || echo "No hay cron jobs para el usuario"`
    },
    {
      name: '5️⃣ VERIFICAR CRON JOBS DEL SISTEMA',
      cmd: `ls -la /etc/cron.d/ 2>/dev/null | grep -i radio || echo "No hay cron jobs en /etc/cron.d/"`
    },
    {
      name: '6️⃣ VER PROCESOS EN EJECUCIÓN',
      cmd: `ps aux | grep -i -E "(radio|record|audio|stream|ffmpeg)" | grep -v grep`
    },
    {
      name: '7️⃣ VERIFICAR PUERTO 5000 (API)',
      cmd: `netstat -tuln | grep :5000 || ss -tuln | grep :5000 || echo "Puerto 5000 no está en uso"`
    },
    {
      name: '8️⃣ LOGS DEL SISTEMA (últimas 50 líneas)',
      cmd: `journalctl -n 50 --no-pager | grep -i -E "(radio|record|audio|stream)" | tail -20`
    },
    {
      name: '9️⃣ VERIFICAR SERVICIO API',
      cmd: `curl -s http://localhost:5000/api/status || echo "API no responde en localhost:5000"`
    },
    {
      name: '🔟 FECHA Y HORA DEL VPS',
      cmd: `date && timedatectl status`
    }
  ];

  for (const command of commands) {
    console.log(`\n${command.name}`);
    console.log('═'.repeat(50));
    
    try {
      // Primero intentar con sshpass (si está instalado)
      const sshCmd = `sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command.cmd}"`;
      const { stdout, stderr } = await execAsync(sshCmd, { timeout: 30000 });
      
      if (stdout.trim()) {
        console.log(stdout);
      }
      if (stderr.trim() && !stderr.includes('Warning: Permanently added')) {
        console.log(`⚠️  STDERR: ${stderr}`);
      }
    } catch (error) {
      if (error.code === 127) {
        // sshpass no está instalado, mostrar comando manual
        console.log(`   ⚠️  sshpass no está instalado. Ejecuta manualmente:`);
        console.log(`   ssh ${VPS_USER}@${VPS_HOST} "${command.cmd}"`);
        console.log(`   Contraseña: ${VPS_PASSWORD}`);
      } else if (error.code === 255) {
        console.log(`❌ Error de conexión SSH: ${error.message}`);
        console.log(`   Verifica las credenciales y conectividad`);
        break;
      } else if (error.code === 1) {
        // Comando retornó error, pero puede ser esperado (ej: grep no encontró coincidencias)
        if (error.stdout && error.stdout.trim()) {
          console.log(error.stdout);
        } else {
          console.log('   (no se encontraron resultados)');
        }
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
}

// Ejecutar diagnóstico
diagnoseVPSService().catch(console.error);