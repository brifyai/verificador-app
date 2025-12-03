const { supabaseDirect } = require('../lib/supabase-direct.js');

async function addMissingRadios() {
  try {
    console.log('📝 Agregando radios faltantes a la tabla radios...');
    
    // Radios que necesitamos agregar según los logs
    const radiosToAdd = [
      {
        id: 'mijm9xci',
        name: 'Radio MiJM9XCI', // Nombre real que queremos mostrar
        stream_url: 'http://stream.example.com/mijm9xci', // URL requerida
        platform: 'HTTP_STREAM', // Valor válido según constraint
        region: 'Región Metropolitana',
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE', // Valor válido según constraint
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xci'
        }
      },
      {
        id: 'mijm9xsi',
        name: 'Radio MiJM9XSI', // Nombre real que queremos mostrar
        stream_url: 'http://stream.example.com/mijm9xsi', // URL requerida
        platform: 'HTTP_STREAM', // Valor válido según constraint
        region: 'Región Metropolitana',
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE', // Valor válido según constraint
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xsi'
        }
      }
    ];
    
    for (const radio of radiosToAdd) {
      try {
        // Verificar si ya existe
        const existing = await supabaseDirect.request(
          `radios?select=id&id=eq.${radio.id}`
        );
        
        if (existing && existing.length > 0) {
          console.log(`✅ Radio ${radio.id} ya existe, actualizando...`);
          
          // Actualizar con el nombre real
          await supabaseDirect.request(`radios?id=eq.${radio.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: radio.name,
              region: radio.region,
              description: radio.description,
              platform: radio.platform,
              status: radio.status,
              metadata: radio.metadata
            })
          });
          
          console.log(`✅ Radio actualizada: ${radio.name} (${radio.id})`);
        } else {
          console.log(`📝 Creando radio: ${radio.name} (${radio.id})`);
          
          // Crear nueva radio
          const newRadio = await supabaseDirect.request('radios', {
            method: 'POST',
            body: JSON.stringify(radio)
          });
          
          if (newRadio) {
            console.log(`✅ Radio creada: ${radio.name} (${radio.id})`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error con radio ${radio.id}:`, error.message);
      }
    }
    
    console.log('✅ Proceso de agregar radios completado');
    
    // Verificar radios finales
    const allRadios = await supabaseDirect.request(
      'radios?select=id,name,region&order=name.asc'
    );
    
    console.log('\n📋 Radios disponibles en la tabla:');
    allRadios.forEach(radio => {
      console.log(`  ID: ${radio.id} | Nombre: ${radio.name} | Región: ${radio.region}`);
    });
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

addMissingRadios();