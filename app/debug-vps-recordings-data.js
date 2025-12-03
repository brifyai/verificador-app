// Script para diagnosticar qué datos reales están llegando del VPS
const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

async function debugVPSRecordings() {
  console.log('🔍 DIAGNÓSTICO: Obteniendo datos crudos del VPS...');
  console.log(`📡 URL: ${VPS_API_URL}/recordings`);
  
  try {
    const response = await fetch(`${VPS_API_URL}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ RESPUESTA COMPLETA DEL VPS:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.recordings && data.recordings.length > 0) {
      console.log(`\n📊 Se encontraron ${data.recordings.length} grabaciones:`);
      
      data.recordings.forEach((recording, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📄 Grabación #${index + 1}:`);
        console.log(`${'='.repeat(60)}`);
        console.log(`filename: ${recording.filename}`);
        console.log(`size: ${recording.size}`);
        console.log(`created_at: ${recording.created_at}`);
        console.log(`path: ${recording.path}`);
        console.log(`radio_id: ${recording.radio_id}`);
        console.log(`radio_name: ${recording.radio_name}`);
        console.log(`radio_region: ${recording.radio_region}`);
        console.log(`radio_city: ${recording.radio_city}`);
        console.log(`radio_programadora: ${recording.radio_programadora}`);
        console.log(`display_name: ${recording.display_name}`);
        
        // Verificar qué campos están undefined
        const undefinedFields = [];
        if (recording.radio_name === undefined) undefinedFields.push('radio_name');
        if (recording.radio_region === undefined) undefinedFields.push('radio_region');
        if (recording.radio_city === undefined) undefinedFields.push('radio_city');
        if (recording.radio_programadora === undefined) undefinedFields.push('radio_programadora');
        
        if (undefinedFields.length > 0) {
          console.log(`⚠️ CAMPOS UNDEFINED: ${undefinedFields.join(', ')}`);
        }
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('🔍 ANÁLISIS DE PATRÓN:');
      console.log('='.repeat(60));
      
      // Verificar si hay alguna grabación con metadatos completos
      const completeRecordings = data.recordings.filter(r => 
        r.radio_name && r.radio_name !== 'undefined' &&
        r.radio_region && r.radio_region !== 'undefined'
      );
      
      console.log(`✅ Grabaciones con metadatos completos: ${completeRecordings.length}`);
      console.log(`❌ Grabaciones sin metadatos: ${data.recordings.length - completeRecordings.length}`);
      
      if (completeRecordings.length === 0) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO: El VPS no está enviando metadatos de radio');
        console.log('💡 SOLUCIÓN: El endpoint /api/recordings del VPS debe enriquecer los datos');
      }
      
    } else {
      console.log('❌ No se encontraron grabaciones');
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo datos del VPS:', error);
  }
}

// Ejecutar
debugVPSRecordings().catch(console.error);