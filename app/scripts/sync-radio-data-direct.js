// Script directo con credenciales para sincronizar datos de radios
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

async function syncRadioDataDirect() {
  console.log('=== SINCRONIZANDO DATOS DE RADIOS A GRABACIONES (DIRECTO) ===\n');
  
  try {
    // 1. Obtener grabaciones que necesitan sincronización
    console.log('1. Buscando grabaciones sin datos de radio completos...');
    
    const recordingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/recordings?select=id,radio_id,radio_name,radio_region,radio_city&or=(radio_name.is.null,radio_region.is.null,radio_city.is.null,radio_name.eq.Radio%20*)&order=created_at.desc&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!recordingsResponse.ok) {
      throw new Error(`Error obteniendo grabaciones: ${recordingsResponse.status}`);
    }
    
    const recordings = await recordingsResponse.json();
    console.log(`📊 Grabaciones encontradas con datos incompletos: ${recordings.length}`);
    
    if (recordings.length === 0) {
      console.log('✅ Todas las grabaciones tienen datos de radio completos');
      return;
    }
    
    // 2. Obtener datos de las radios correspondientes
    console.log('\n2. Obteniendo datos de las radios...');
    const radioIds = [...new Set(recordings.map(rec => rec.radio_id).filter(id => id))];
    console.log(`📡 IDs de radio únicos encontrados: ${radioIds.length}`);
    
    if (radioIds.length === 0) {
      console.log('⚠️ No se encontraron IDs de radio válidos');
      return;
    }
    
    // Obtener datos de todas las radios necesarias
    const radiosData = {};
    for (const radioId of radioIds) {
      try {
        const radioResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/radios?select=id,name,region,description,platform,metadata&id=eq.${radioId}`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!radioResponse.ok) {
          console.log(`⚠️ Error obteniendo radio ${radioId}: ${radioResponse.status}`);
          continue;
        }
        
        const radioData = await radioResponse.json();
        
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
    
    // 3. Actualizar grabaciones con datos de radio
    console.log('\n3. Actualizando grabaciones con datos de radio...');
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const recording of recordings) {
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
        const updateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/recordings?id=eq.${recording.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updatedData)
          }
        );
        
        if (updateResponse.ok) {
          console.log(`✅ Grabación ${recording.id} actualizada: "${radioData.name}" (${radioData.region})`);
          updatedCount++;
        } else {
          console.log(`❌ Error actualizando grabación ${recording.id}: ${updateResponse.status}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error actualizando grabación ${recording.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`✅ Grabaciones actualizadas: ${updatedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesado: ${updatedCount + errorCount}`);
    
    // 4. Verificar resultado final
    console.log('\n4. Verificando resultado final...');
    const finalResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/recordings?select=id,radio_id,radio_name,radio_region,radio_city&limit=5&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      if (finalData && finalData.length > 0) {
        console.log('\n📋 Ejemplos de grabaciones actualizadas:');
        finalData.forEach(rec => {
          console.log(`- ID: ${rec.id}, Radio: ${rec.radio_name} (${rec.radio_id}), Región: ${rec.radio_region}, Ciudad: ${rec.radio_city}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
console.log('Iniciando sincronización de datos de radios...');
syncRadioDataDirect().then(() => {
  console.log('\n✅ Sincronización completada');
}).catch(console.error);