const { supabaseDirect } = require('../lib/supabase-direct');

async function verifyAndSyncRadioData() {
  console.log('=== VERIFICANDO Y SINCRONIZANDO DATOS DE RADIOS A GRABACIONES ===\n');
  
  try {
    // 1. Verificar estructura de la tabla recordings
    console.log('1. Verificando estructura de tabla recordings...');
    const recordingsStructure = await supabaseDirect.request('recordings?select=id&limit=1');
    if (recordingsStructure) {
      console.log('✅ Tabla recordings existe y es accesible');
    } else {
      console.log('❌ Tabla recordings no existe o no es accesible');
      return;
    }
    
    // 2. Obtener todas las grabaciones que no tienen datos de radio completos
    console.log('\n2. Buscando grabaciones sin datos de radio completos...');
    const incompleteRecordings = await supabaseDirect.request(
      'recordings?select=id,radio_id,radio_name,radio_region,radio_city&or=(radio_name.is.null,radio_region.is.null,radio_city.is.null,radio_name.eq.Radio%20*)'
    );
    
    console.log(`📊 Grabaciones encontradas con datos incompletos: ${incompleteRecordings?.length || 0}`);
    
    if (!incompleteRecordings || incompleteRecordings.length === 0) {
      console.log('✅ Todas las grabaciones tienen datos de radio completos');
      return;
    }
    
    // 3. Obtener datos de las radios correspondientes
    console.log('\n3. Obteniendo datos de las radios...');
    const radioIds = [...new Set(incompleteRecordings.map(rec => rec.radio_id).filter(id => id))];
    console.log(`📡 IDs de radio únicos encontrados: ${radioIds.length}`);
    
    if (radioIds.length === 0) {
      console.log('⚠️ No se encontraron IDs de radio válidos');
      return;
    }
    
    // Obtener datos de todas las radios necesarias
    const radiosData = {};
    for (const radioId of radioIds) {
      try {
        const radioData = await supabaseDirect.request(
          `radios?select=id,name,region,description,platform,metadata&id=eq.${radioId}`
        );
        
        if (radioData && radioData.length > 0) {
          radiosData[radioId] = radioData[0];
          console.log(`✅ Radio encontrada: ${radioData[0].name} (${radioId})`);
        } else {
          console.log(`⚠️ Radio no encontrada: ${radioId}`);
          radiosData[radioId] = {
            id: radioId,
            name: `Radio ${radioId}`,
            region: 'Región no especificada',
            description: 'Ciudad no especificada',
            platform: 'Plataforma no especificada'
          };
        }
      } catch (error) {
        console.log(`❌ Error obteniendo radio ${radioId}:`, error.message);
        radiosData[radioId] = {
          id: radioId,
          name: `Radio ${radioId}`,
          region: 'Región no especificada',
          description: 'Ciudad no especificada',
          platform: 'Plataforma no especificada'
        };
      }
    }
    
    // 4. Actualizar grabaciones con datos de radio
    console.log('\n4. Actualizando grabaciones con datos de radio...');
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const recording of incompleteRecordings) {
      try {
        const radioData = radiosData[recording.radio_id];
        if (!radioData) {
          console.log(`⚠️ No hay datos para radio ${recording.radio_id}`);
          continue;
        }
        
        // Preparar datos actualizados
        const updatedData = {
          radio_name: radioData.name,
          radio_region: radioData.region || 'Región no especificada',
          radio_city: radioData.description || 'Ciudad no especificada',
          radio_programadora: radioData.platform || 'Plataforma no especificada',
          metadata: {
            ...(recording.metadata || {}),
            radio_data_synced: new Date().toISOString(),
            radio_data_source: 'radio_table_sync',
            original_radio_name: recording.radio_name
          }
        };
        
        // Actualizar grabación
        await supabaseDirect.request(`recordings?id=eq.${recording.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatedData)
        });
        
        console.log(`✅ Grabación ${recording.id} actualizada: "${radioData.name}" (${radioData.region})`);
        updatedCount++;
        
      } catch (error) {
        console.log(`❌ Error actualizando grabación ${recording.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`✅ Grabaciones actualizadas: ${updatedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesado: ${updatedCount + errorCount}`);
    
    // 5. Verificar resultado final
    console.log('\n5. Verificando resultado final...');
    const finalCheck = await supabaseDirect.request(
      'recordings?select=id,radio_id,radio_name,radio_region,radio_city&limit=5'
    );
    
    if (finalCheck && finalCheck.length > 0) {
      console.log('\n📋 Ejemplos de grabaciones actualizadas:');
      finalCheck.forEach(rec => {
        console.log(`- ID: ${rec.id}, Radio: ${rec.radio_name} (${rec.radio_id}), Región: ${rec.radio_region}, Ciudad: ${rec.radio_city}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
verifyAndSyncRadioData().catch(console.error);