#!/usr/bin/env node

/**
 * Diagnóstico COMPLETO del VPS para identificar el servicio de grabación
 * 
 * Este script:
 * 1. Ejecuta todos los comandos de diagnóstico
 * 2. Guarda los resultados en un archivo de log
 * 3. Analiza los resultados para identificar el servicio de grabación
 * 4. Proporciona recomendaciones específicas
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const LOG_FILE = path.join(__dirname, 'vps-diagnosis-result.log');

console.log('🔍 DIAGNÓSTICO COMPLETO DEL VPS - SERVICIO DE GRABACIÓN');
console.log('=====================================================\n');

// Comandos de diagnóstico
const diagnosticCommands = [
    {
        id: 'DIR_RECORDINGS',
        name: '📁 Verificar directorio de grabaciones',
        cmd: 'ls -lah /home/radioapp/radio-recorder/recordings/ 2>&1'
    },
    {
        id: 'FIND_SCRIPTS',
        name: '🔍 Buscar scripts de grabación (Python, Node, Shell)',
        cmd: 'find /home/radioapp -type f \\( -name "*.py" -o -name "*.js" -o -name "*.sh" \\) 2>/dev/null | head -20'
    },
    {
        id: 'LIST_RADIOPAPP',
        name: '📂 Listar contenido de /home/radioapp',
        cmd: 'ls -lah /home/radioapp/ 2>&1'
    },
    {
        id: 'PS_PROCESSES',
        name: '⚙️  Procesos en ejecución relacionados',
        cmd: 'ps aux | grep -E "(ffmpeg|python|node|radio|record)" | grep -v grep'
    },
    {
        id: 'SYSTEMD_SERVICES',
        name: '🔧 Servicios systemd activos',
        cmd: 'systemctl list-units --type=service --state=active --no-pager 2>&1 | grep -i -E "(radio|record|audio|stream)" || echo "No se encontraron servicios relacionados"'
    },
    {
        id: 'CRON_JOBS',
        name: '⏰ Cron jobs del usuario radioapp',
        cmd: 'crontab -u radioapp -l 2>&1 || echo "No hay cron jobs para radioapp"'
    },
    {
        id: 'CRON_ROOT',
        name: '⏰ Cron jobs del root',
        cmd: 'crontab -l 2>&1 || echo "No hay cron jobs para root"'
    },
    {
        id: 'PORT_5000',
        name: '🌐 Proceso en el puerto 5000 (API)',
        cmd: 'netstat -tulpn 2>/dev/null | grep :5000 || ss -tulpn 2>/dev/null | grep :5000 || echo "Puerto 5000 no está en uso"'
    },
    {
        id: 'DOCKER_PS',
        name: '🐳 Contenedores Docker activos',
        cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>&1 || echo "Docker no está instalado o no hay contenedores"'
    },
    {
        id: 'CHECK_API',
        name: '🔍 Verificar API de grabaciones',
        cmd: 'curl -s http://localhost:5000/api/status 2>&1 || echo "API no responde en localhost:5000"'
    },
    {
        id: 'TIMESTAMPS',
        name: '📅 Timestamps de archivos de grabación',
        cmd: 'ls -l /home/radioapp/radio-recorder/recordings/ 2>&1 | grep -E "(Nov 27|Nov 28)" || echo "No hay archivos recientes"'
    },
    {
        id: 'FIND_RECORDER_SCRIPT',
        name: '🎯 Buscar script específico de radio-recorder',
        cmd: 'find /home/radioapp -name "*ecorder*" -type f 2>/dev/null || find /root -name "*ecorder*" -type f 2>/dev/null || echo "No se encontró script de recorder"'
    }
];

// Resultados del diagnóstico
const results = {};

async function runDiagnosis() {
    console.log(`🚀 Iniciando diagnóstico en ${VPS_HOST}...\n`);
    
    // Crear archivo de log
    fs.writeFileSync(LOG_FILE, `DIAGNÓSTICO VPS - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);
    
    for (const command of diagnosticCommands) {
        console.log(`${command.name}...`);
        
        try {
            const sshCmd = `sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command.cmd}"`;
            const { stdout, stderr } = await execAsync(sshCmd, { timeout: 30000 });
            
            const output = stdout || stderr || '(sin salida)';
            results[command.id] = output;
            
            // Guardar en log
            fs.appendFileSync(LOG_FILE, `\n${'='.repeat(60)}\n${command.name}\n${'='.repeat(60)}\n${output}\n`);
            
            console.log(`   ✅ Completado (${output.split('\\n').length} líneas)`);
            
        } catch (error) {
            const errorMsg = `Error: ${error.message}`;
            results[command.id] = errorMsg;
            fs.appendFileSync(LOG_FILE, `\n${'='.repeat(60)}\n${command.name}\n${'='.repeat(60)}\n${errorMsg}\n`);
            console.log(`   ❌ Error: ${error.message.substring(0, 80)}...`);
        }
    }
    
    console.log('\n✅ Diagnóstico completado');
    console.log(`📄 Resultados guardados en: ${LOG_FILE}`);
    
    // Analizar resultados
    await analyzeResults();
}

async function analyzeResults() {
    console.log('\n🔍 ANALIZANDO RESULTADOS...\n');
    
    const analysis = {
        foundRecordingDir: false,
        foundScripts: false,
        foundActiveProcess: false,
        foundSystemdService: false,
        foundCronJob: false,
        foundDockerContainer: false,
        apiResponding: false,
        recommendations: []
    };
    
    // Analizar directorio de grabaciones
    if (results.DIR_RECORDINGS && !results.DIR_RECORDINGS.includes('No such file')) {
        analysis.foundRecordingDir = true;
        console.log('✅ Directorio de grabaciones encontrado');
        
        // Extraer lista de archivos
        const files = results.DIR_RECORDINGS.split('\n')
            .filter(line => line.includes('.mp3'))
            .map(line => line.trim());
        
        if (files.length > 0) {
            console.log(`   📊 Encontrados ${files.length} archivos MP3`);
            files.slice(0, 5).forEach(file => console.log(`      - ${file.split(' ').pop()}`));
            if (files.length > 5) console.log(`      ... y ${files.length - 5} más`);
        }
    } else {
        analysis.recommendations.push('❌ No se encontró el directorio de grabaciones. Verificar la ruta /home/radioapp/radio-recorder/recordings/');
    }
    
    // Analizar scripts
    if (results.FIND_SCRIPTS && results.FIND_SCRIPTS.trim() && !results.FIND_SCRIPTS.includes('No such file')) {
        analysis.foundScripts = true;
        console.log('\n✅ Scripts encontrados:');
        results.FIND_SCRIPTS.split('\n').forEach(script => {
            if (script.trim()) console.log(`   📄 ${script.trim()}`);
        });
    } else {
        analysis.recommendations.push('❌ No se encontraron scripts de grabación. Buscar en otras ubicaciones.');
    }
    
    // Analizar procesos activos
    if (results.PS_PROCESSES && results.PS_PROCESSES.trim()) {
        analysis.foundActiveProcess = true;
        console.log('\n⚠️  Procesos activos encontrados:');
        results.PS_PROCESSES.split('\n').forEach(proc => {
            if (proc.trim()) console.log(`   🔄 ${proc.trim()}`);
        });
    } else {
        console.log('\nℹ️  No hay procesos de grabación activos actualmente');
    }
    
    // Analizar servicios systemd
    if (results.SYSTEMD_SERVICES && !results.SYSTEMD_SERVICES.includes('No se encontraron')) {
        analysis.foundSystemdService = true;
        console.log('\n✅ Servicios systemd encontrados:');
        results.SYSTEMD_SERVICES.split('\n').forEach(service => {
            if (service.trim()) console.log(`   🔧 ${service.trim()}`);
        });
    } else {
        analysis.recommendations.push('ℹ️  No se encontraron servicios systemd específicos de grabación');
    }
    
    // Analizar cron jobs
    if (results.CRON_JOBS && !results.CRON_JOBS.includes('No hay cron jobs')) {
        analysis.foundCronJob = true;
        console.log('\n✅ Cron jobs encontrados:');
        console.log(`   ${results.CRON_JOBS}`);
    } else {
        console.log('\nℹ️  No se encontraron cron jobs para radioapp');
    }
    
    // Analizar Docker
    if (results.DOCKER_PS && !results.DOCKER_PS.includes('no hay contenedores') && !results.DOCKER_PS.includes('no está instalado')) {
        analysis.foundDockerContainer = true;
        console.log('\n✅ Contenedores Docker encontrados:');
        results.DOCKER_PS.split('\n').forEach(container => {
            if (container.trim()) console.log(`   🐳 ${container.trim()}`);
        });
    } else {
        console.log('\nℹ️  No se encontraron contenedores Docker activos');
    }
    
    // Analizar API
    if (results.CHECK_API && !results.CHECK_API.includes('no responde')) {
        analysis.apiResponding = true;
        console.log('\n✅ API responde correctamente');
    } else {
        analysis.recommendations.push('⚠️  La API en localhost:5000 no responde. Verificar el servicio.');
    }
    
    // Mostrar recomendaciones
    console.log('\n' + '='.repeat(60));
    console.log('📋 RECOMENDACIONES');
    console.log('='.repeat(60));
    
    if (analysis.recommendations.length > 0) {
        analysis.recommendations.forEach(rec => console.log(rec));
    } else {
        console.log('✅ Todos los componentes principales están identificados');
    }
    
    // Determinar próximos pasos
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRÓXIMOS PASOS');
    console.log('='.repeat(60));
    
    if (analysis.foundScripts && !analysis.foundActiveProcess) {
        console.log('1. 🔍 Identificar cuál script es el servicio de grabación');
        console.log('2. ▶️  Iniciar el servicio manualmente');
        console.log('3. 🔧 Configurar servicio systemd para inicio automático');
    } else if (analysis.foundSystemdService) {
        console.log('1. 🔧 Iniciar el servicio systemd: systemctl start <servicio>');
        console.log('2. 🔄 Habilitar inicio automático: systemctl enable <servicio>');
    } else if (analysis.foundCronJob) {
        console.log('1. ⏰ Verificar por qué el cron job no está ejecutándose');
        console.log('2. 📝 Revisar logs del cron: journalctl -u cron');
    } else if (analysis.foundDockerContainer) {
        console.log('1. 🐳 Iniciar contenedor Docker: docker start <contenedor>');
        console.log('2. 🔄 Configurar reinicio automático del contenedor');
    } else {
        console.log('1. 📂 Verificar contenido completo de /home/radioapp');
        console.log('2. 🔍 Buscar archivos de configuración');
        console.log('3. 📖 Revisar logs del sistema: journalctl -n 100');
    }
    
    // Guardar análisis
    fs.appendFileSync(LOG_FILE, `\n${'='.repeat(60)}\nANÁLISIS Y RECOMENDACIONES\n${'='.repeat(60)}\n`);
    fs.appendFileSync(LOG_FILE, JSON.stringify(analysis, null, 2));
    
    console.log(`\n📄 Reporte completo guardado en: ${LOG_FILE}`);
}

// Ejecutar diagnóstico
runDiagnosis().catch(error => {
    console.error('❌ Error en el diagnóstico:', error);
    process.exit(1);
});