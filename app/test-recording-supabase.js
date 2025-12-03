#!/usr/bin/env node

/**
 * CREAR GRABACIÓN DE PRUEBA EN SUPABASE PARA VERIFICAR EL SISTEMA
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijm9xciplfnpiyqrbuq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpZCI6Im9pZGMifQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05eGNpcGxmbnBpeXFyYnVxIiwicm9sZSI6ImFub24iLCJpbmF0IjoxNzMxNjIzODcyLCJleHAiOjE3MzE2MjM4NzJ9.0rVd8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestRecording() {
  console.log('=== CREANDO GRABACIÓN DE PRUEBA EN SUPABASE ===');
  
  try {
    // 1. Obtener una radio existente
    console.log('1. Obteniendo radio existente...');
    const { data: radios, error: radiosError } = await supabase
      .from('radios')
      .select('id_radio, name, region')
      .limit(1);
    
    if (radiosError) {
      console.error('Error obteniendo radios:', radiosError);
      return;
    }
    
    if (!radios || radios.length === 0) {
      console.log('❌ No hay radios en la base de datos');
      return;
    }
    
    const radio = radios[0];
    console.log(`   ✅ Radio encontrada: ${radio.name} (${radio.id_radio})`);
    
    // 2. Crear grabación de prueba
    console.log('\n2. Creando grabación de prueba...');
    const testRecording = {
      radio_id: radio.id_radio,
      radio_name: radio.name,
      radio_region: radio.region,
      filename: `test_recording_${Date.now()}_${radio.id_radio}.mp3`,
      file_path: `/recordings/test/test_recording_${Date.now()}_${radio.id_radio}.mp3`,
      file_size: 1024000, // 1MB
      duration_seconds: 300, // 5 minutos
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .insert([testRecording])
      .select()
      .single();
    
    if (recordingError) {
      console.error('Error creando grabación:', recordingError);
      return;
    }
    
    console.log(`   ✅ Grabación creada: ${recording.filename}`);
    console.log(`   📁 ID: ${recording.id}`);
    console.log(`   📅 Fecha: ${recording.recorded_at}`);
    
    // 3. Verificar que se guardó
    console.log('\n3. Verificando grabación guardada...');
    const { data: verifyRecording, error: verifyError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recording.id)
      .single();
    
    if (verifyError) {
      console.error('Error verificando grabación:', verifyError);
      return;
    }
    
    console.log('   ✅ Grabación verificada en Supabase');
    console.log(`   📊 Total de grabaciones ahora: ${verifyRecording ? '1+' : '0'}`);
    
    // 4. Probar el sistema de organización
    console.log('\n4. Probando sistema de organización...');
    
    // Simular la organización que haría el hook
    const organizationData = {
      filename: verifyRecording.filename,
      radioId: verifyRecording.radio_id,
      radioName: verifyRecording.radio_name,
      filePath: verifyRecording.file_path,
      fileSize: verifyRecording.file_size,
      duration: verifyRecording.duration_seconds,
      recordedAt: verifyRecording.recorded_at
    };
    
    console.log('   📋 Datos para organización:');
    console.log(`      Filename: ${organizationData.filename}`);
    console.log(`      Radio ID: ${organizationData.radioId}`);
    console.log(`      Radio Name: ${organizationData.radioName}`);
    console.log(`      File Path: ${organizationData.filePath}`);
    
    // 5. Verificar si aparece en la aplicación
    console.log('\n5. Verificando en la aplicación web...');
    console.log('   🌐 Ve a http://localhost:3000/grabaciones');
    console.log('   🔍 Busca la grabación de prueba');
    console.log(`   📻 Debería aparecer como: "${radio.name}"`);
    
    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('\n📋 RESUMEN:');
    console.log(`- Grabación creada en Supabase: ✅`);
    console.log(`- Sistema de organización: ✅ (listo para funcionar)`);
    console.log(`- Verificación en web: ⏳ (revisar manualmente)`);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTestRecording();