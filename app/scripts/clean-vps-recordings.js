// Script para eliminar TODAS las grabaciones del VPS
const axios = require('axios');

async function cleanVPSRecordings() {
  console.log('🧹 LIMPIANDO TODAS LAS GRABACIONES DEL VPS...');
  console.log('==============================================\n');
  
  try {
    // Paso 1: Obtener la lista actual de grabaciones
    console.log('📋 Obteniendo lista de grabaciones actuales...');
    
    const listResponse = await axios.get('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const data = listResponse.data;
    const recordings = data.recordings || [];
    
    console.log(`📊 Encontradas ${recordings.length} grabaciones para eliminar\n`);
    
    if (recordings.length === 0) {
      console.log('✅ No hay grabaciones para eliminar');
      return;
    }
    
    // Paso 2: Eliminar cada grabación individualmente
    console.log('🗑️ Eliminando grabaciones una por una...\n');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < recordings.length; i++) {
      const recording = recordings[i];
      
      try {
        console.log(`[${i + 1}/${recordings.length}] Eliminando: ${recording.filename}`);
        
        // Intentar eliminar la grabación
        try {
          const deleteResponse = await axios.delete(`http://213.199.39.147:5000/api/recordings/${encodeURIComponent(recording.filename)}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`   ✅ Eliminada: ${recording.filename}`);
          deletedCount++;
        } catch (deleteError) {
          if (deleteError.response) {
            console.log(`   ❌ Error eliminando: ${recording.filename} (${deleteError.response.status})`);
          } else {
            console.log(`   ❌ Error eliminando: ${recording.filename} - ${deleteError.message}`);
          }
          errorCount++;
        }
        
        // Pequeña pausa entre eliminaciones para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error grave eliminando: ${recording.filename} - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log('========================');
    console.log(`✅ Grabaciones eliminadas: ${deletedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesadas: ${recordings.length}`);
    
    // Paso 3: Verificar que quede limpio
    console.log('\n🔍 Verificando que el VPS quede limpio...');
    
    const finalResponse = await axios.get('http://213.199.39.147:5000/api/recordings', {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const finalData = finalResponse.data;
    const remainingRecordings = finalData.recordings || [];
    
    if (remainingRecordings.length === 0) {
      console.log('🎉 ¡VPS COMPLETAMENTE LIMPIO! No quedan grabaciones.');
    } else {
      console.log(`⚠️  Aún quedan ${remainingRecordings.length} grabaciones:`);
      remainingRecordings.forEach(recording => {
        console.log(`   - ${recording.filename}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  }
}

// Ejecutar la limpieza
cleanVPSRecordings();