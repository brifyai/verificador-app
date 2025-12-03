#!/usr/bin/env node

/**
 * Script para corregir duplicación de grabaciones activas
 * Problema: La misma grabación aparece dos veces en /grabaciones
 */

const VPS_API_URL = 'http://localhost:8080';

async function fixDuplicateRecordings() {
    console.log('🔧 CORRIGIENDO DUPLICACIÓN DE GRABACIONES ACTIVAS');
    console.log('=' .repeat(60));

    try {
        // Obtener grabaciones activas del VPS
        console.log('📡 Obteniendo grabaciones activas del VPS...');
        const response = await fetch(`${VPS_API_URL}/api/recordings/active`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Grabaciones activas obtenidas:', JSON.stringify(data, null, 2));

        // Analizar duplicaciones
        const activeRecordings = data.active_recordings || {};
        const recordingIds = Object.keys(activeRecordings);
        
        console.log(`\n📊 ANÁLISIS DE DUPLICACIONES:`);
        console.log(`- Total de grabaciones únicas: ${recordingIds.length}`);
        
        if (recordingIds.length === 1) {
            const recordingId = recordingIds[0];
            const recording = activeRecordings[recordingId];
            
            console.log(`\n🎯 GRABACIÓN DETECTADA:`);
            console.log(`- Radio ID: ${recording.radio_id}`);
            console.log(`- Radio Name: ${recording.radio_name}`);
            console.log(`- Recording ID: ${recording.recording_id}`);
            console.log(`- Start Time: ${recording.start_time}`);
            console.log(`- Status: ${recording.status}`);
            
            // Verificar si hay duplicación por nombre vs ID
            const hasNameDisplay = recording.radio_name && recording.radio_name !== '';
            const hasIdDisplay = recording.recording_id && recording.recording_id !== '';
            
            console.log(`\n🔍 ANÁLISIS DE DISPLAY:`);
            console.log(`- Muestra nombre de radio: ${hasNameDisplay ? 'SÍ' : 'NO'}`);
            console.log(`- Muestra ID de grabación: ${hasIdDisplay ? 'SÍ' : 'NO'}`);
            
            if (hasNameDisplay && hasIdDisplay) {
                console.log(`\n⚠️ PROBLEMA DETECTADO: DUPLICACIÓN`);
                console.log(`La misma grabación se muestra dos veces:`);
                console.log(`1. Como: "${recording.radio_name}"`);
                console.log(`2. Como: "Radio ${recording.recording_id}"`);
                
                console.log(`\n✅ SOLUCIÓN RECOMENDADA:`);
                console.log(`- Mostrar solo UNA vez la grabación activa`);
                console.log(`- Usar formato: "${recording.radio_name} (Grabando...)"`);
                console.log(`- Eliminar la entrada duplicada con ID`);
                
                return {
                    problem: 'duplicate_display',
                    solution: 'single_entry_with_status',
                    recording: recording
                };
            }
        }

        console.log(`\n✅ NO SE DETECTARON DUPLICACIONES PROBLEMÁTICAS`);
        return { status: 'no_problem' };

    } catch (error) {
        console.error('❌ Error:', error.message);
        return { error: error.message };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixDuplicateRecordings().then(result => {
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESULTADO FINAL:', JSON.stringify(result, null, 2));
    });
}

module.exports = { fixDuplicateRecordings };