const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoic2VydmljZV9yb2xlIn9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRadioStructure() {
  console.log('🔍 Analizando estructura real de la tabla radios...\n');

  try {
    // 1. Obtener información del esquema de la tabla
    console.log('1. Obteniendo esquema de la tabla radios...');
    
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('information_schema.columns', {
        table_name: 'radios'
      });

    if (schemaError) {
      console.log('❌ Error al obtener esquema:', schemaError);
    } else if (schemaInfo && schemaInfo.length > 0) {
      console.log('✅ Esquema de la tabla radios:');
      schemaInfo.forEach(column => {
        console.log(`   📋 ${column.column_name}: ${column.data_type} ${column.is_nullable ? '(nullable)' : '(required)'}`);
      });
    } else {
      console.log('ℹ️ No se pudo obtener el esquema, intentando método alternativo...');
    }

    console.log('');

    // 2. Intentar obtener una radio existente
    console.log('2. Buscando radios existentes...');
    
    const { data: radios, error: fetchError } = await supabase
      .from('radios')
      .select('*')
      .limit(1);

    if (fetchError || !radios || radios.length === 0) {
      console.log('❌ No se encontraron radios para analizar');
      console.log('   Error:', fetchError?.message || 'No hay datos');
      
      // Intentar crear una radio de prueba con campos mínimos
      console.log('\n3. Creando radio de prueba para análisis...');
      
      const minimalRadio = {
        name: 'Radio Test Estructura',
        frequency: '100.1 FM',
        is_active: true
      };
      
      const { data: createdRadio, error: createError } = await supabase
        .from('radios')
        .insert([minimalRadio])
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Error al crear radio de prueba:', createError);
        console.log('   Mensaje:', createError.message);
        console.log('   Detalles:', createError.details);
        console.log('   Código:', createError.code);
        console.log('   Hint:', createError.hint);
        
        // Intentar obtener la estructura de otra manera
        console.log('\n4. Intentando obtener estructura mediante consulta SQL...');
        
        const { data: tableStructure, error: structureError } = await supabase
          .rpc('pg_table_def', {
            tablename: 'radios'
          });
          
        if (structureError) {
          console.log('❌ Error al obtener estructura:', structureError);
        } else {
          console.log('✅ Estructura obtenida:', tableStructure);
        }
        
        return;
      }
      
      console.log('✅ Radio de prueba creada exitosamente');
      console.log(`   ID: ${createdRadio.id}`);
      console.log('');
      
      // Analizar la estructura
      analyzeStructure(createdRadio);
      
      // Limpiar
      console.log('\n5. Eliminando radio de prueba...');
      await supabase.from('radios').delete().eq('id', createdRadio.id);
      console.log('✅ Radio de prueba eliminada');
      
    } else {
      // Analizar estructura de radio existente
      analyzeStructure(radios[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function analyzeStructure(radio) {
  console.log('3. Estructura completa de la tabla radios:');
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

  // Verificar campos específicos que el backend intenta actualizar
  console.log('4. Verificación de campos que el backend intenta actualizar:');
  
  const camposBackendDirectos = [
    'name', 'stream_url', 'platform', 'region', 'status', 'description',
    'last_verification_status', 'last_verified_at', 'updated_at'
  ];
  
  const camposBackendMetadata = [
    'programadora', 'frequency', 'city', 'website', 'streamPlatform', 
    'platformData', 'lastMonitored'
  ];
  
  console.log('   Campos directos de la tabla radios:');
  camposBackendDirectos.forEach(campo => {
    if (radio.hasOwnProperty(campo)) {
      console.log(`   ✅ ${campo}: EXISTE en la tabla`);
    } else {
      console.log(`   ❌ ${campo}: NO EXISTE en la tabla`);
    }
  });

  console.log('   Campos que el backend espera en metadata:');
  camposBackendMetadata.forEach(campo => {
    if (radio.hasOwnProperty(campo)) {
      console.log(`   ⚠️  ${campo}: EXISTE como campo directo (el backend espera en metadata)`);
    } else if (radio.metadata && radio.metadata.hasOwnProperty(campo)) {
      console.log(`   ✅ ${campo}: EXISTE en metadata`);
    } else {
      console.log(`   ❌ ${campo}: NO EXISTE (ni como campo directo ni en metadata)`);
    }
  });

  console.log('');

  // Verificar si hay campo metadata
  if (radio.metadata) {
    console.log('5. Contenido del campo metadata:');
    console.log('   ', JSON.stringify(radio.metadata, null, 2));
  } else {
    console.log('5. Campo metadata: NO EXISTE o es null');
  }

  console.log('');

  // Verificar campos de stream y plataforma
  console.log('6. Campos de streaming:');
  console.log(`   stream_url: ${radio.stream_url || 'null'}`);
  console.log(`   platform: ${radio.platform || 'null'}`);
  if (radio.metadata) {
    console.log(`   metadata.streamPlatform: ${radio.metadata.streamPlatform || 'null'}`);
  }
  console.log('');
}

// Ejecutar
analyzeRadioStructure();