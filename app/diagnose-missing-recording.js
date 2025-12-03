#!/usr/bin/env node

/**
 * Diagnóstico de grabaciones perdidas
 * Investigar por qué la grabación del usuario no aparece en /grabaciones
 */

const VPS_API_URL = 'http://213.199.39.147:5000';

async function diagnoseMissingRecording() {
    console.log('🔍 DIAGNÓSTICO: GRABACIÓN PERDIDA DEL USUARIO');
    console.log('=' .repeat(60));

    try {
        // 1. Verificar estado actual del VPS
        console.log('📡 1. Verificando estado actual del VPS...');
        
        // Obtener grabaciones activas
        const activeResponse = await fetch(`${VPS_API_URL}/api/active-recordings`);
        if (activeResponse.ok) {
            const activeData = await activeResponse.json();
            console.log('📊 Grabaciones activas actuales:', JSON.stringify(activeData, null, 2));
        }

        // Obtener todas las grabaciones
        console.log('\n📡 2. Obteniendo lista completa de grabaciones del VPS...');
        const recordingsResponse = await fetch(`${VPS_API_URL}/api/recordings`);
        
        if (recordingsResponse.ok) {
            const recordingsData = await recordingsResponse.json();
            console.log('📊 Total de grabaciones en VPS:', recordingsData.recordings?.length || 0);
            
            if (recordingsData.recordings && recordingsData.recordings.length > 0) {
                console.log('\n📋 Grabaciones encontradas:');
                recordingsData.recordings.forEach((recording, index) => {
                    console.log(`${index + 1}. ${recording.filename}`);
                    console.log(`   - Tamaño: ${recording.file_size || 'N/A'} bytes`);
                    console.log(`   - Fecha: ${recording.recorded_at || recording.created || 'N/A'}`);
                    console.log(`   - Path: ${recording.file_path || recording.path || 'N/A'}`);
                });
            }
        }

        // 2. Verificar si hay grabaciones recientes (últimas 2 horas)
        console.log('\n📡 3. Buscando grabaciones recientes...');
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        
        if (recordingsResponse.ok) {
            const recordingsData = await recordingsResponse.json();
            const recentRecordings = recordingsData.recordings?.filter(recording => {
                const recordingDate = recording.recorded_at || recording.created;
                return recordingDate && recordingDate > twoHoursAgo;
            }) || [];
            
            console.log(`📊 Grabaciones de las últimas 2 horas: ${recentRecordings.length}`);
            
            if (recentRecordings.length > 0) {
                console.log('\n🎯 GRABACIONES RECIENTES ENCONTRADAS:');
                recentRecordings.forEach((recording, index) => {
                    console.log(`${index + 1}. ${recording.filename}`);
                    console.log(`   - Fecha: ${recording.recorded_at || recording.created}`);
                    console.log(`   - Tamaño: ${recording.file_size || 'N/A'} bytes`);
                });
            }
        }

        // 3. Verificar archivos físicos
        console.log('\n📡 4. Verificando existencia física de archivos...');
        if (recordingsResponse.ok) {
            const recordingsData = await recordingsResponse.json();
            
            for (const recording of recordingsData.recordings || []) {
                try {
                    const fileResponse = await fetch(`${VPS_API_URL}/recordings/${recording.filename}`, {
                        method: 'HEAD'
                    });
                    
                    const exists = fileResponse.ok && fileResponse.status === 200;
                    console.log(`${exists ? '✅' : '❌'} ${recording.filename}: ${exists ? 'EXISTE' : 'NO EXISTE'}`);
                    
                    if (!exists) {
                        console.log(`   ⚠️ Archivo reportado pero no existe físicamente`);
                    }
                } catch (error) {
                    console.log(`❌ ${recording.filename}: ERROR al verificar - ${error.message}`);
                }
            }
        }

        // 4. Verificar logs del sistema
        console.log('\n📡 5. Analizando patrones de error...');
        console.log('🔍 Posibles causas de la grabación perdida:');
        console.log('   1. ❌ Grabación iniciada pero no se guardó el archivo físico');
        console.log('   2. ❌ Error en el proceso de grabación del VPS');
        console.log('   3. ❌ Archivo creado pero luego eliminado');
        console.log('   4. ❌ Problema de sincronización con base de datos');

        console.log('\n📋 RECOMENDACIONES:');
        console.log('   1. 🔄 Reiniciar el servicio de grabación del VPS');
        console.log('   2. 🧹 Limpiar caché y reiniciar aplicación');
        console.log('   3. 📊 Verificar logs del VPS para errores');
        console.log('   4. 🎙️ Intentar nueva grabación de prueba');

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    diagnoseMissingRecording().then(() => {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 DIAGNÓSTICO COMPLETADO');
    });
}

module.exports = { diagnoseMissingRecording };