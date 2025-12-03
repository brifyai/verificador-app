// Script para eliminar grabaciones específicas del VPS usando la API
async function deleteVPSRecordings() {
  try {
    console.log('🗑️ Eliminando grabaciones específicas del VPS usando API...');
    
    // Grabaciones a eliminar (basadas en los filenames que mencionaste)
    const recordingsToDelete = [
      'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
      'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
      'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
    ];
    
    let totalDeleted = 0;
    
    for (const filename of recordingsToDelete) {
      console.log(`🗑️ Intentando eliminar: ${filename}`);
      
      try {
        // Intentar eliminar usando la API del VPS
        const response = await fetch(`http://213.199.39.147:5000/api/recordings/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Grabación eliminada exitosamente: ${filename}`);
          console.log(`   Respuesta:`, result);
          totalDeleted++;
        } else if (response.status === 404) {
          console.log(`⚠️ Grabación no encontrada en VPS: ${filename}`);
        } else {
          const errorData = await response.text();
          console.error(`❌ Error eliminando grabación ${filename}: ${response.status} ${response.statusText}`);
          console.error(`   Detalles:`, errorData);
        }
      } catch (error) {
        console.error(`❌ Error de conexión eliminando ${filename}:`, error.message);
      }
      
      // Pequeña pausa entre eliminaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Proceso completado. Total de grabaciones eliminadas: ${totalDeleted}`);
    
    // Verificar grabaciones restantes en el VPS
    console.log('\n📋 Verificando grabaciones restantes en VPS...');
    try {
      const response = await fetch('http://213.199.39.147:5000/api/recordings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Grabaciones restantes en VPS: ${data.recordings?.length || 0}`);
        
        if (data.recordings && data.recordings.length > 0) {
          console.log('📁 Grabaciones restantes:');
          data.recordings.forEach(rec => {
            console.log(`  - ${rec.filename} (${rec.size || '0'} bytes)`);
          });
        } else {
          console.log('✅ No hay grabaciones restantes en el VPS');
        }
      } else {
        console.error('❌ Error obteniendo grabaciones restantes:', response.status);
      }
    } catch (error) {
      console.error('❌ Error de conexión verificando grabaciones restantes:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

deleteVPSRecordings();