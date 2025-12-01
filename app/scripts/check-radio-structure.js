const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRadioStructure() {
  console.log('🔍 Verificando estructura real de la tabla radios...\n');

  try {
    // 1. Obtener una radio existente para ver su estructura
    console.log('1. Obteniendo estructura de radios existentes...');
    const { data: radios, error: fetchError } = await supabase
      .from('radios')
      .select('*')
      .limit(1);

    if (fetchError || !radios || radios.length === 0) {
      console.log('❌ No se encontraron radios para analizar');
      return;
    }

    const radio = radios[0];
    console.log('✅ Radio encontrada para análisis');
    console.log(`   ID: ${radio.id}`);
    console.log(`   Nombre: ${radio.name}`);
    console.log('');

    // 2. Mostrar TODOS los campos disponibles
    console.log('2. Estructura completa de la tabla radios:');
    console.log('   Campos disponibles:');
    
    Object.keys(radio).forEach(key => {
      const value = radio[key];
      const type = value === null ? 'null' : typeof value;
      const preview = value !== null && typeof value === 'string' && value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      
      console.log(`   📋 ${key}: ${type} = ${preview}`);
    });

    console.log('');

    // 3. Verificar campos específicos que el backend intenta actualizar
    console.log('3. Verificación de campos críticos:');
    
    const camposBackend = [
      'name', 'programadora', 'frequency', 'stream_url', 'stream_platform', 
      'region', 'city', 'website', 'is_active', 'genre', 'priority', 
      'cost_per_hour', 'platform', 'status', 'description', 'metadata'
    ];
    
    camposBackend.forEach(campo => {
      if (radio.hasOwnProperty(campo)) {
        console.log(`   ✅ ${campo}: EXISTE en la tabla`);
      } else {
        console.log(`   ❌ ${campo}: NO EXISTE en la tabla`);
      }
    });

    console.log('');

    // 4. Verificar si hay campos en metadata
    if (radio.metadata) {
      console.log('4. Contenido del campo metadata:');
      console.log('   ', JSON.stringify(radio.metadata, null, 2));
    } else {
      console.log('4. Campo metadata: NO EXISTE o es null');
    }

    console.log('');

    // 5. Verificar campos de stream y plataforma
    console.log('5. Campos de streaming:');
    console.log(`   stream_url: ${radio.stream_url || 'null'}`);
    console.log(`   stream_platform: ${radio.stream_platform || 'null'}`);
    console.log(`   platform: ${radio.platform || 'null'}`);
    console.log('');

    // 6. Intentar una actualización de prueba
    console.log('6. Prueba de actualización de campo simple...');
    
    const testUpdate = {
      name: `${radio.name} - TEST UPDATE`
    };
    
    const { data: updatedRadio, error: updateError } = await supabase
      .from('radios')
      .update(testUpdate)
      .eq('id', radio.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error al actualizar:', updateError);
    } else {
      console.log('✅ Actualización exitosa');
      console.log(`   Nombre anterior: ${radio.name}`);
      console.log(`   Nombre nuevo: ${updatedRadio.name}`);
      
      // Restaurar valor original
      await supabase
        .from('radios')
        .update({ name: radio.name })
        .eq('id', radio.id);
      
      console.log('✅ Valor original restaurado');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
checkRadioStructure();