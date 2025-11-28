#!/usr/bin/env node

/**
 * Analizar scripts de grabación para entender el proceso
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const LOG_FILE = path.join(__dirname, 'recording-scripts-analysis.log');

console.log('🔍 ANALIZANDO SCRIPTS DE GRABACIÓN\n');

const commands = [
    {
        name: '📖 Leer script de grabación principal',
        cmd: 'cat /home/radioapp/radio-recorder/scripts/record_radio.sh 2>&1'
    },
    {
        name: '📖 Leer servidor API (primeras 100 líneas)',
        cmd: 'cat /home/radioapp/radio-recorder/scripts/api_server.py 2>&1 | head -100'
    },
    {
        name: '📖 Leer servidor API (líneas 101-200)',
        cmd: 'cat /home/radioapp/radio-recorder/scripts/api_server.py 2>&1 | sed -n \'101,200p\''
    },
    {
        name: '📖 Leer radio_manager.py',
        cmd: 'cat /home/radioapp/radio-recorder/scripts/radio_manager.py 2>&1 | head -80'
    },
    {
        name: '📋 Verificar últimas líneas del log del servidor',
        cmd: 'tail -50 /home/radioapp/radio-recorder/server.log 2>&1'
    },
    {
        name: '📋 Verificar archivo de grabaciones activas',
        cmd: 'cat /home/radioapp/radio-recorder/active_recordings.json 2>&1'
    },
    {
        name: '📋 Verificar archivos de log de grabación',
        cmd: 'ls -lah /home/radioapp/radio-recorder/logs/ 2>&1'
    },
    {
        name: '📋 Verificar último log de grabación',
        cmd: 'ls -t /home/radioapp/radio-recorder/logs/*.log 2>/dev/null | head -1 | xargs tail -30 2>&1 || echo "No hay logs de grabación"'
    },
    {
        name: '🔍 Buscar errores en logs',
        cmd: 'grep -i "error\|fail\|exception" /home/radioapp/radio-recorder/server.log 2>&1 | tail -20 || echo "No se encontraron errores recientes"'
    },
    {
        name: '📅 Verificar timestamp de última grabación',
        cmd: 'ls -lt /home/radioapp/radio-recorder/recordings/*.mp3 2>&1 | head -1'
    }
];

fs.writeFileSync(LOG_FILE, `ANÁLISIS DE SCRIPTS DE GRABACIÓN - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);

async function analyzeScripts() {
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

    console.log(`\n✅ Análisis completado`);
    console.log(`📄 Resultados guardados en: ${LOG_FILE}`);
}

analyzeScripts().catch(error => {
    console.error('❌ Error en el análisis:', error);
    process.exit(1);
});