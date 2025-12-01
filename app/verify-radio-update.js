// Script para verificar la estructura esperada por el backend vs la real
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase desde variables de entorno
require('dotenv').config({ path: './app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configuración de Supabase...');
console.log('URL:', supabaseUrl);
console.log('Service Key presente:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Falta configuración de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Estructura que el backend PUT espera actualizar (basado en el código analizado)
const backendExpectedStructure = {
  // Campos directos de la tabla radios
  directFields: [
    'name',           // ✓ Línea 159
    'stream_url',     // ✓ Línea 161
    'platform',       // ✓ Línea 163 (mapeado desde streamPlatform)
    'region',         // ✓ Línea 164
    'status',         // ✓ Línea 166 (mapeado desde isActive)
    'description',    // ✓ Línea 168 (contiene genre)
    'last_verification_status', // ✓ Línea 150
    'last_verified_at', // ✓ Línea 151
    'updated_at',     // ✓ Línea 180
    'metadata'        // ✓ Línea 170-179 (objeto completo)
  ],
  
  // Campos dentro del objeto metadata
  metadataFields: [
    'programadora',   // ✓ Línea 171
    'frequency',      // ✓ Línea 172
    'city',           // ✓ Línea 173
    'website',        // ✓ Línea 174
    'streamPlatform', // ✓ Línea 176
    'platformData',   // ✓ Línea 177
    'lastMonitored'   // ✓ Línea 178
  ]
};

async function verifyRadioStructure() {
  console.log('\n🔍 Analizando discrepancia entre backend y base de datos...\n');

  try {
    // 1. Intentar obtener una radio existente
    console.log('1. Buscando radios existentes...');
    
    const { data: radios, error: fetchError } = await supabase
      .from('radios')
      .select('*')
      .limit(1);

    let radio;
    
    if (fetchError || !radios || radios.length === 0) {
      console.log('⚠️  No se encontraron radios, creando una de prueba...');
      
      // Crear radio de prueba con campos mínimos que seguramente existen
      const testRadio = {
        name: 'Radio Test Verificación',
        is_active: true
      };
      
      const { data: createdRadio, error: createError } = await supabase
        .from('radios')
        .insert([testRadio])
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Error al crear radio de prueba:', createError.message);
        console.log('   Esto confirma que hay un problema de autenticación o permisos');
        return;
      }
      
      radio = createdRadio;
      console.log('✅ Radio de prueba creada con ID:', radio.id);
    } else {
      radio = radios[0];
      console.log('✅ Radio encontrada con ID:', radio.id);
    }

    console.log('');

    // 2. Analizar la estructura real
    console.log('2. Estructura REAL de la tabla radios:');
    const realFields = Object.keys(radio);
    realFields.forEach(field => {
      const value = radio[field];
      const type = value === null ? 'null' : typeof value;
      const preview = value !== null && typeof value === 'string' && value.length > 30 
        ? value.substring(0, 30) + '...' 
        : value;
      console.log(`   📋 ${field}: ${type} = ${preview}`);
    });

    console.log('');

    // 3. Verificar qué campos espera el backend vs lo que realmente existe
    console.log('3. DISCREPANCIA entre backend y base de datos:');
    
    console.log('   Campos que el backend intenta actualizar en la tabla:');
    backendExpectedStructure.directFields.forEach(field => {
      if (realFields.includes(field)) {
        console.log(`   ✅ ${field}: EXISTE en la tabla`);
      } else {
        console.log(`   ❌ ${field}: NO EXISTE en la tabla (backend lo intentará actualizar)`);
      }
    });

    console.log('   Campos que el backend intenta actualizar en metadata:');
    backendExpectedStructure.metadataFields.forEach(field => {
      if (radio.metadata && radio.metadata.hasOwnProperty(field)) {
        console.log(`   ✅ metadata.${field}: EXISTE en metadata`);
      } else if (realFields.includes(field)) {
        console.log(`   ⚠️  ${field}: EXISTE como campo directo (backend espera en metadata)`);
      } else {
        console.log(`   ❌ metadata.${field}: NO EXISTE (backend lo intentará actualizar)`);
      }
    });

    console.log('');

    // 4. Probar una actualización simulando el backend
    console.log('4. Probando actualización con lógica del backend...');
    
    // Simular el updateData que el backend enviaría (líneas 158-181)
    const simulatedUpdate = {
      name: 'Radio Test Backend',
      stream_url: 'https://test.backend.com/stream.mp3',
      platform: 'ICECAST',
      region: 'Test Region',
      status: 'ACTIVE',
      description: 'Test Genre',
      metadata: {
        programadora: 'Test Programadora',
        frequency: '99.9 FM',
        city: 'Test City',
        website: 'https://test.com',
        streamPlatform: 'icecast',
        platformData: null,
        lastMonitored: 'Nunca'
      },
      updated_at: new Date().toISOString()
    };

    console.log('   Datos que enviaría el backend:');
    console.log('   ', JSON.stringify(simulatedUpdate, null, 2));
    
    const { data: updatedRadio, error: updateError } = await supabase
      .from('radios')
      .update(simulatedUpdate)
      .eq('id', radio.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error al actualizar (esto confirma el problema):');
      console.log('   Mensaje:', updateError.message);
      console.log('   Detalles:', updateError.details);
      console.log('   Código:', updateError.code);
      console.log('   Hint:', updateError.hint);
      
      // Identificar qué campo causó el problema
      if (updateError.message) {
        const missingFieldMatch = updateError.message.match(/column "(.+?)"/);
        if (missingFieldMatch) {
          console.log(`   🎯 CAMPO PROBLEMA: "${missingFieldMatch[1]}" no existe en la tabla`);
        }
      }
    } else {
      console.log('✅ Actualización exitosa');
      console.log('   Resultado:', JSON.stringify(updatedRadio, null, 2));
    }

    // Limpiar - eliminar radio de prueba si la creamos
    if (radio.name === 'Radio Test Verificación') {
      console.log('\n5. Limpiando radio de prueba...');
      await supabase.from('radios').delete().eq('id', radio.id);
      console.log('✅ Radio de prueba eliminada');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
verifyRadioStructure();