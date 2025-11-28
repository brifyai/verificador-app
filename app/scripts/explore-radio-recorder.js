#!/usr/bin/env node

/**
 * Explorar el directorio radio-recorder para encontrar el script de grabación
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const LOG_FILE = path.join(__dirname, 'radio-recorder-exploration.log');

console.log('🔍 EXPLORANDO DIRECTORIO RADIO-RECORDER\n');

async function exploreDirectory() {
    const commands = [
        {
            name: '📂 Listar contenido completo de radio-recorder',
            cmd: 'ls -lah /home/radioapp/radio-recorder/'
        },
        {
            name: '📄 Verificar app.py o main.py',
            cmd: 'ls -lah /home/radioapp/radio-recorder/*.py 2>&1'
        },
        {
            name: '📖 Leer app.py si existe',
            cmd: 'cat /home/radioapp/radio-recorder/app.py 2>&1 | head -50'
        },
        {
            name: '📖 Leer requirements.txt',
            cmd: 'cat /home/radioapp/radio-recorder/requirements.txt 2>&1'
        },
        {
            name: '📖 Leer restart-vps-server.sh',
            cmd: 'cat /home/radioapp/radio-recorder/restart-vps-server.sh 2>&1'
        },
        {
            name: '📖 Leer diagnostic-vps-remote.sh',
            cmd: 'cat /home/radioapp/radio-recorder/diagnostic-vps-remote.sh 2>&1'
        },
        {
            name: '📂 Verificar estructura de directorios',
            cmd: 'find /home/radioapp/radio-recorder -type f -name "*.py" | head -20'
        },
        {
            name: '📂 Buscar archivos de configuración',
            cmd: 'find /home/radioapp/radio-recorder -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.env" -o -name "config.*" 2>/dev/null'
        },
        {
            name: '📂 Buscar scripts de grabación',
            cmd: 'find /home/radioapp/radio-recorder -name "*record*" -o -name "*radio*" -o -name "*grab*" 2>/dev/null'
        },
        {
            name: '📂 Verificar logs',
            cmd: 'find /home/radioapp/radio-recorder -name "*.log" -o -name "log_*" 2>/dev/null'
        },
        {
            name: '📂 Verificar directorio de fuentes',
            cmd: 'ls -lah /home/radioapp/radio-recorder/src/ 2>&1 || ls -lah /home/radioapp/radio-recorder/lib/ 2>&1 || echo "No hay directorios src/ o lib/"'
        },
        {
            name: '📋 Verificar proceso Python en ejecución',
            cmd: 'ps aux | grep python3 | grep -v grep'
        },
        {
            name: '📋 Verificar qué archivo está ejecutando el proceso',
            cmd: 'ls -l /proc/$(pgrep -f "python3" | head -1)/cwd 2>&1 || echo "No se pudo obtener info del proceso"'
        }
    ];

    fs.writeFileSync(LOG_FILE, `EXPLORACIÓN RADIO-RECORDER - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);

    for (const command of commands) {
        console.log(`${command.name}...`);
        
        try {
            const sshCmd = `sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command.cmd}"`;
            const { stdout, stderr } = await execAsync(sshCmd, { timeout: 30000 });
            
            const output = stdout || stderr || '(sin salida)';
            console.log(`   ✅ Completado (${output.split('\\n').length} líneas)`);
            
            fs.appendFileSync(LOG_FILE, `\n${'='.repeat(60)}\n${command.name}\n${'='.repeat(60)}\n${output}\n`);
            
        } catch (error) {
            const errorMsg = `Error: ${error.message}`;
            console.log(`   ❌ Error: ${error.message.substring(0, 60)}...`);
            fs.appendFileSync(LOG_FILE, `\n${'='.repeat(60)}\n${command.name}\n${'='.repeat(60)}\n${errorMsg}\n`);
        }
    }

    console.log(`\n✅ Exploración completada`);
    console.log(`📄 Resultados guardados en: ${LOG_FILE}`);
}

exploreDirectory().catch(error => {
    console.error('❌ Error en la exploración:', error);
    process.exit(1);
});