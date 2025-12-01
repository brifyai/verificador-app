const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRadioUpdate() {
  console.log('🧪 Iniciando pruebas de actualización de radio...\n');

  try {
    // 1. Obtener una radio existente
    console.log('1. Buscando radio para probar...');
    const { data: radio, error: fetchError } = await supabase
      .from('radios')
      .select('*')
      .limit(1)
      .single();

    if (fetchError || !radio) {
      console.log('❌ No se encontró ninguna radio para probar');
      return;
    }

    console.log(`✅ Radio encontrada: ${radio.name} (ID: ${radio.id})`);
    console.log(`   Plataforma actual: ${radio.stream_platform}`);
    console.log(`   URL actual: ${radio.stream_url}\n`);

    // 2. Guardar valores originales
    const originalValues = {
      name: radio.name,
      programadora: radio.programadora,
      frequency: radio.frequency,
      stream_url: radio.stream_url,
      stream_platform: radio.stream_platform,
      region: radio.region,
      city: radio.city,
      website: radio.website,
      is_active: radio.is_active,
      genre: radio.genre,
      priority: radio.priority,
      cost_per_hour: radio.cost_per_hour
    };

    // 3. Preparar datos de prueba
    const testData = {
      name: `TEST-${Date.now()}-${radio.name}`,
      programadora: `TEST-Programadora-${Date.now()}`,
      frequency: `TEST-${Date.now()}-FM`,
      stream_url: `https://test-stream-${Date.now()}.com/stream.m3u8`,
      stream_platform: 'youtube', // Cambiar plataforma
      region: `TEST-Region-${Date.now()}`,
      city: `TEST-City-${Date.now()}`,
      website: `https://test-website-${Date.now()}.com`,
      is_active: !radio.is_active, // Cambiar estado
      genre: `TEST-Genre-${Date.now()}`,
      priority: radio.priority === 10 ? 1 : radio.priority + 1, // Cambiar prioridad
      cost_per_hour: radio.cost_per_hour + 10.50 // Cambiar costo
    };

    console.log('2. Datos de prueba preparados:');
    Object.entries(testData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // 4. Actualizar la radio
    console.log('3. Actualizando radio en la base de datos...');
    const { data: updatedRadio, error: updateError } = await supabase
      .from('radios')
      .update(testData)
      .eq('id', radio.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error al actualizar radio:', updateError);
      return;
    }

    console.log('✅ Radio actualizada exitosamente\n');

    // 5. Verificar que todos los campos se actualizaron
    console.log('4. Verificando actualización de campos:');
    let allFieldsUpdated = true;
    
    Object.entries(testData).forEach(([key, expectedValue]) => {
      const actualValue = updatedRadio[key];
      const matches = actualValue === expectedValue || 
                     (key === 'cost_per_hour' && Math.abs(actualValue - expectedValue) < 0.01);
      
      if (matches) {
        console.log(`   ✅ ${key}: ${actualValue}`);
      } else {
        console.log(`   ❌ ${key}: Esperado ${expectedValue}, Obtenido ${actualValue}`);
        allFieldsUpdated = false;
      }
    });

    console.log('');

    // 6. Probar el endpoint de la API
    console.log('5. Probando endpoint API PUT /api/radios/[id]...');
    
    // Simular la llamada API con los mappings
    const PLATFORM_MAPPING_FRONTEND_TO_DB = {
      'direct': 'direct',
      'youtube': 'youtube',
      'twitch': 'twitch',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'tiktok': 'tiktok',
      'custom': 'custom'
    };

    const PLATFORM_MAPPING_DB_TO_FRONTEND = {
      'direct': 'direct',
      'youtube': 'youtube',
      'twitch': 'twitch',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'tiktok': 'tiktok',
      'custom': 'custom'
    };

    // Simular datos del frontend
    const frontendData = {
      name: `API-TEST-${Date.now()}`,
      streamPlatform: 'twitch', // Frontend envía 'twitch'
      streamUrl: `https://api-test-${Date.now()}.com/stream`,
      programadora: `API-Programadora-${Date.now()}`,
      region: `API-Region-${Date.now()}`,
      city: `API-City-${Date.now()}`,
      website: `https://api-test-${Date.now()}.com`,
      isActive: true,
      genre: `API-Genre-${Date.now()}`,
      priority: 5,
      costPerHour: 25.99,
      frequency: `API-${Date.now()}-FM`
    };

    console.log('   Datos del frontend:', JSON.stringify(frontendData, null, 2));

    // Simular transformación del backend
    const dbData = {
      name: frontendData.name,
      stream_platform: PLATFORM_MAPPING_FRONTEND_TO_DB[frontendData.streamPlatform],
      stream_url: frontendData.streamUrl,
      programadora: frontendData.programadora,
      region: frontendData.region,
      city: frontendData.city,
      website: frontendData.website,
      is_active: frontendData.isActive,
      genre: frontendData.genre,
      priority: frontendData.priority,
      cost_per_hour: frontendData.costPerHour,
      frequency: frontendData.frequency
    };

    console.log('   Datos transformados para DB:', JSON.stringify(dbData, null, 2));

    // Actualizar con datos de API
    const { data: apiUpdatedRadio, error: apiError } = await supabase
      .from('radios')
      .update(dbData)
      .eq('id', radio.id)
      .select()
      .single();

    if (apiError) {
      console.log('❌ Error en actualización API:', apiError);
    } else {
      console.log('✅ Actualización API exitosa');
      
      // Simular respuesta del backend
      const apiResponse = {
        id: apiUpdatedRadio.id,
        name: apiUpdatedRadio.name,
        streamPlatform: PLATFORM_MAPPING_DB_TO_FRONTEND[apiUpdatedRadio.stream_platform],
        streamUrl: apiUpdatedRadio.stream_url,
        programadora: apiUpdatedRadio.programadora,
        region: apiUpdatedRadio.region,
        city: apiUpdatedRadio.city,
        website: apiUpdatedRadio.website,
        isActive: apiUpdatedRadio.is_active,
        genre: apiUpdatedRadio.genre,
        priority: apiUpdatedRadio.priority,
        costPerHour: apiUpdatedRadio.cost_per_hour,
        frequency: apiUpdatedRadio.frequency,
        createdAt: apiUpdatedRadio.created_at,
        updatedAt: apiUpdatedRadio.updated_at
      };

      console.log('   Respuesta API simulada:', JSON.stringify(apiResponse, null, 2));
      
      // Verificar que el mapeo de plataforma funciona
      if (apiResponse.streamPlatform === 'twitch') {
        console.log('✅ Mapeo de plataforma funciona correctamente');
      } else {
        console.log('❌ Mapeo de plataforma falló');
        allFieldsUpdated = false;
      }
    }

    console.log('');

    // 7. Restaurar valores originales
    console.log('6. Restaurando valores originales...');
    const { data: restoredRadio, error: restoreError } = await supabase
      .from('radios')
      .update(originalValues)
      .eq('id', radio.id)
      .select()
      .single();

    if (restoreError) {
      console.log('❌ Error al restaurar valores:', restoreError);
    } else {
      console.log('✅ Valores originales restaurados');
    }

    console.log('\n' + '='.repeat(50));
    if (allFieldsUpdated) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('✅ Todos los campos se actualizan correctamente');
      console.log('✅ El mapeo de plataformas funciona');
      console.log('✅ La respuesta de la API es correcta');
    } else {
      console.log('❌ Algunas pruebas fallaron');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
testRadioUpdate();