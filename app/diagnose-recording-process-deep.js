#!/usr/bin/env node

/**
 * DIAGNÓSTICO PROFUNDO DEL PROCESO DE GRABACIÓN
 * 
 * Esta herramienta investiga paso a paso qué está fallando en el proceso de grabación
 * desde el momento en que el usuario hace clic hasta que se produce el error HTTP.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000';
const LOCAL_URL = 'http://localhost:3000';

// Colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(`🔍 ${title}`, 'bright');
    console.log('='.repeat(60));
}

function logStep(step, description) {
    log(`\n[${step}] ${description}`, 'cyan');
}

function logError(error, context) {
    log(`\n❌ ERROR en ${context}:`, 'red');
    if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Status Text: ${error.response.statusText}`, 'red');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else if (error.request) {
        log(`   No response received`, 'red');
        log(`   Request: ${error.request}`, 'red');
    } else {
        log(`   Message: ${error.message}`, 'red');
    }
}

async function testVPSHealth() {
    logStep('1', 'Verificando salud del VPS');
    
    try {
        const response = await axios.get(`${VPS_URL}/api/health`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Recording-Diagnostic-Tool/1.0'
            }
        });
        
        log(`✅ VPS Health: ${JSON.stringify(response.data)}`, 'green');
        return true;
    } catch (error) {
        logError(error, 'VPS Health Check');
        return false;
    }
}

async function testVPSRecordingEndpoints() {
    logStep('2', 'Probando endpoints de grabación del VPS');
    
    const endpoints = [
        '/api/start-recording',
        '/api/stop-recording',
        '/api/active-recordings',
        '/api/radios'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${VPS_URL}${endpoint}`, {
                timeout: 10000,
                validateStatus: (status) => true // Aceptar todos los status codes
            });
            
            log(`✅ ${endpoint}: ${response.status} - ${response.statusText}`, 
                response.status >= 200 && response.status < 300 ? 'green' : 'yellow');
            
            if (response.data) {
                log(`   Response data preview: ${JSON.stringify(response.data).substring(0, 200)}...`, 'blue');
            }
        } catch (error) {
            logError(error, `Endpoint ${endpoint}`);
        }
    }
}

async function testSpecificRadioRecording(radioData) {
    logStep('3', `Probando grabación con radio específica: ${radioData.name}`);
    
    try {
        // Simular el proceso completo de grabación
        log(`   Radio ID: ${radioData.id}`);
        log(`   Stream URL: ${radioData.stream_url}`);
        log(`   VPS ID: ${radioData.vps_id || 'No mapeado'}`);
        
        // Paso 1: Verificar stream
        log(`   🔍 Verificando stream...`);
        const streamResponse = await axios.get(`${LOCAL_URL}/api/verify-stream-proxy`, {
            params: {
                url: radioData.stream_url,
                radio_id: radioData.id
            },
            timeout: 15000
        });
        
        log(`   ✅ Stream verificado: ${streamResponse.data.status}`, 'green');
        
        // Paso 2: Intentar grabación
        log(`   🎙️ Intentando grabación...`);
        
        const recordingPayload = {
            radio_id: radioData.vps_id || radioData.id,
            stream_url: radioData.stream_url,
            duration: 30 // 30 segundos de prueba
        };
        
        log(`   📤 Payload enviado: ${JSON.stringify(recordingPayload, null, 2)}`, 'blue');
        
        const recordingResponse = await axios.post(
            `${VPS_URL}/api/start-recording`,
            recordingPayload,
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Recording-Diagnostic-Tool/1.0'
                },
                validateStatus: (status) => true
            }
        );
        
        log(`   📥 Response: ${recordingResponse.status} - ${recordingResponse.statusText}`, 
            recordingResponse.status >= 200 && recordingResponse.status < 300 ? 'green' : 'red');
        
        if (recordingResponse.data) {
            log(`   📄 Response data: ${JSON.stringify(recordingResponse.data, null, 2)}`, 'blue');
        }
        
        return {
            success: recordingResponse.status >= 200 && recordingResponse.status < 300,
            status: recordingResponse.status,
            data: recordingResponse.data
        };
        
    } catch (error) {
        logError(error, `Grabación de ${radioData.name}`);
        return {
            success: false,
            error: error.message,
            details: error.response ? error.response.data : null
        };
    }
}

async function analyzeRecordingFlow() {
    logSection('ANÁLISIS DEL FLUJO DE GRABACIÓN COMPLETO');
    
    // Obtener datos de radios de prueba
    const testRadios = [
        {
            id: 'radio-contagio',
            name: 'Radio Contagio',
            stream_url: 'https://radio.digitalfm.cl:8000/arica',
            vps_id: 80
        },
        {
            id: 'radio-somos-petorca',
            name: 'Radio Somos Petorca',
            stream_url: 'https://stream5.eltelar.com:8192/stream',
            vps_id: 85
        },
        {
            id: 'digital-fm-arica',
            name: 'Digital FM Arica',
            stream_url: 'https://radio.digitalfm.cl:8000/arica',
            vps_id: 2
        }
    ];
    
    logStep('0', 'Configuración de prueba');
    log(`   VPS URL: ${VPS_URL}`, 'blue');
    log(`   Local URL: ${LOCAL_URL}`, 'blue');
    log(`   Radios de prueba: ${testRadios.length}`, 'blue');
    
    // Verificar salud del VPS
    const vpsHealthy = await testVPSHealth();
    if (!vpsHealthy) {
        log('\n❌ El VPS no está respondiendo correctamente', 'red');
        return;
    }
    
    // Probar endpoints del VPS
    await testVPSRecordingEndpoints();
    
    // Probar grabación con cada radio
    logSection('PRUEBAS DE GRABACIÓN INDIVIDUALES');
    
    for (const radio of testRadios) {
        const result = await testSpecificRadioRecording(radio);
        
        if (result.success) {
            log(`✅ ${radio.name}: GRABACIÓN EXITOSA`, 'green');
        } else {
            log(`❌ ${radio.name}: FALLÓ LA GRABACIÓN`, 'red');
            if (result.details) {
                log(`   Detalles: ${JSON.stringify(result.details, null, 2)}`, 'yellow');
            }
        }
        
        // Esperar un poco entre pruebas
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Análisis final
    logSection('ANÁLISIS FINAL Y RECOMENDACIONES');
    log('🔍 Basándome en los resultados de las pruebas:', 'cyan');
    log('   1. Verifica que los VPS IDs estén correctamente mapeados', 'yellow');
    log('   2. Asegúrate de que el payload tenga el formato correcto', 'yellow');
    log('   3. Revisa que el VPS tenga espacio disponible para grabaciones', 'yellow');
    log('   4. Verifica que el stream URL esté accesible desde el VPS', 'yellow');
    log('   5. Revisa los logs del VPS para errores específicos', 'yellow');
}

// Ejecutar el diagnóstico
if (require.main === module) {
    analyzeRecordingFlow().catch(error => {
        log(`\n❌ Error fatal en el diagnóstico: ${error.message}`, 'red');
        console.error(error);
    });
}

module.exports = { analyzeRecordingFlow, testSpecificRadioRecording };