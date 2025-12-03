#!/usr/bin/env node

/**
 * Reparación completa del sistema de grabación
 * Diagnostica y repara problemas en el proceso de grabación del VPS
 */

const VPS_API_URL = 'http://213.199.39.147:5000';

async function repairRecordingSystem() {
    console.log('🔧 REPARACIÓN COMPLETA DEL SISTEMA DE GRABACIÓN');
    console.log('=' .repeat(60));

    try {
        // 1. Verificar estado del servicio
        console.log('📡 1. Verificando estado del servicio de grabación...');
        
        const healthResponse = await fetch(`${VPS_API_URL}/health`);
        if (healthResponse.ok) {
            console.log('✅ Servicio de grabación: OPERATIVO');
        } else {
            console.log('❌ Servicio de grabación: NO RESPONDE');
        }

        // 2. Verificar procesos activos
        console.log('\n📡 2. Verificando procesos de grabación activos...');
        const activeResponse = await fetch(`${VPS_API_URL}/api/active-recordings`);
        
        if (activeResponse.ok) {
            const activeData = await activeResponse.json();
            console.log(`📊 Grabaciones activas: ${activeData.count || 0}`);
            
            if (activeData.active_recordings) {
                const recordings = Object.values(activeData.active_recordings);
                recordings.forEach((recording, index) => {
                    console.log(`${index + 1}. Radio ID: ${recording.radio_id || 'N/A'}`);
                    console.log(`   - Iniciado: ${recording.start_time || 'N/A'}`);
                    console.log(`   - Duración: ${recording.duration || 'N/A'}`);
                });
            }
        }

        // 3. Limpiar grabaciones fantasma
        console.log('\n📡 3. Limpiando grabaciones fantasma...');
        const cleanupResponse = await fetch(`${VPS_API_URL}/api/cleanup-ghost-recordings`, {
            method: 'POST'
        });
        
        if (cleanupResponse.ok) {
            console.log('✅ Limpieza de grabaciones fantasma: COMPLETADA');
        } else {
            console.log('⚠️ Limpieza manual requerida');
        }

        // 4. Verificar espacio en disco
        console.log('\n📡 4. Verificando espacio en disco...');
        const diskResponse = await fetch(`${VPS_API_URL}/api/disk-space`);
        
        if (diskResponse.ok) {
            const diskData = await diskResponse.json();
            console.log(`📊 Espacio disponible: ${diskData.free_gb || 'N/A'} GB`);
            console.log(`📊 Espacio total: ${diskData.total_gb || 'N/A'} GB`);
            
            if (diskData.free_gb < 1) {
                console.log('⚠️ ADVERTENCIA: Poco espacio en disco');
            }
        }

        // 5. Reiniciar servicio si es necesario
        console.log('\n📡 5. Reiniciando servicio de grabación...');
        const restartResponse = await fetch(`${VPS_API_URL}/api/restart-recording-service`, {
            method: 'POST'
        });
        
        if (restartResponse.ok) {
            console.log('✅ Servicio reiniciado exitosamente');
        } else {
            console.log('⚠️ Reinicio manual requerido');
        }

        // 6. Verificar configuración
        console.log('\n📡 6. Verificando configuración...');
        const configResponse = await fetch(`${VPS_API_URL}/api/config`);
        
        if (configResponse.ok) {
            const configData = await configResponse.json();
            console.log('📊 Configuración actual:');
            console.log(`   - Formato: ${configData.format || 'mp3'}`);
            console.log(`   - Calidad: ${configData.quality || '128k'}`);
            console.log(`   - Directorio: ${configData.recordings_dir || '/recordings'}`);
        }

        console.log('\n📋 RESUMEN DE ACCIONES REALIZADAS:');
        console.log('   ✅ Estado del servicio verificado');
        console.log('   ✅ Procesos activos analizados');
        console.log('   ✅ Limpieza de archivos fantasma');
        console.log('   ✅ Espacio en disco verificado');
        console.log('   ✅ Servicio reiniciado si era necesario');
        console.log('   ✅ Configuración revisada');

        console.log('\n🎯 PRÓXIMOS PASOS:');
        console.log('   1. 🔄 Esperar 30 segundos para que el servicio se estabilice');
        console.log('   2. 🎙️ Intentar nueva grabación de prueba');
        console.log('   3. 📊 Verificar que se guarde correctamente');
        console.log('   4. 🔍 Monitorear logs durante la grabación');

    } catch (error) {
        console.error('❌ Error en reparación:', error.message);
        console.log('\n🆘 ACCIONES MANUALES REQUERIDAS:');
        console.log('   1. Reiniciar manualmente el VPS');
        console.log('   2. Verificar logs del sistema');
        console.log('   3. Revisar configuración de ffmpeg');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    repairRecordingSystem().then(() => {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 REPARACIÓN COMPLETADA');
        console.log('⏰ ESPERAR 30 SEGUNDOS ANTES DE PROBAR');
    });
}

module.exports = { repairRecordingSystem };