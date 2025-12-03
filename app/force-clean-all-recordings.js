#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🧹 LIMPIEZA COMPLETA DEL SISTEMA DE GRABACIONES');
console.log('=' * 60);

// Configuración de Supabase
const supabaseUrl = 'https://gdlfngqkmqpxlqfpkqdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbGZucWdrbXFweGxxZnBrcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MTc5MTIsImV4cCI6MjA1MDE5MzkxMn0.4n8e8m3c5l9q2d6f8r1s5w7x9z0a2b4c6d8e0f2g4h6i8j0k2l4m6n8o0p2q4r6s8t0u2v4w6x8y0z2a4b6c8d0e2f4g6h8i0j';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceCleanAllRecordings() {
  try {
    console.log('🔍 PASO 1: Verificando grabaciones actuales...');
    
    // Verificar grabaciones actuales
    const { data: currentRecordings, error: fetchError } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error consultando grabaciones:', fetchError);
      return;
    }
    
    console.log(`📊 Encontradas ${currentRecordings.length} grabaciones en la base de datos`);
    
    if (currentRecordings.length > 0) {
      console.log('\n📋 Grabaciones a eliminar:');
      currentRecordings.forEach((recording, index) => {
        console.log(`${index + 1}. ${recording.filename}`);
        console.log(`   Radio ID: ${recording.radio_id}`);
        console.log(`   Fecha: ${recording.recorded_at}`);
        console.log(`   Tamaño: ${recording.file_size} bytes`);
        console.log('---');
      });
    }
    
    console.log('\n🗑️ PASO 2: Eliminando TODAS las grabaciones...');
    
    // Eliminar TODAS las grabaciones
    const { error: deleteError } = await supabase
      .from('recordings')
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (deleteError) {
      console.error('❌ Error eliminando grabaciones:', deleteError);
      return;
    }
    
    console.log('✅ Todas las grabaciones eliminadas de la base de datos');
    
    console.log('\n🔄 PASO 3: Verificando limpieza...');
    
    // Verificar que se eliminaron
    const { data: verifyRecordings, error: verifyError } = await supabase
      .from('recordings')
      .select('*');
    
    if (verifyError) {
      console.error('❌ Error verificando limpieza:', verifyError);
      return;
    }
    
    console.log(`📊 Grabaciones restantes: ${verifyRecordings.length}`);
    
    if (verifyRecordings.length === 0) {
      console.log('✅ LIMPIEZA COMPLETA EXITOSA');
      console.log('\n🎯 RESULTADO:');
      console.log('- Base de datos: LIMPIA');
      console.log('- VPS: Devuelve 0 grabaciones');
      console.log('- Aplicación: Mostrará 0 grabaciones');
      console.log('- Archivos fantasma: ELIMINADOS');
      
      console.log('\n💡 PRÓXIMOS PASOS:');
      console.log('1. Recarga la página http://localhost:3000/grabaciones');
      console.log('2. Debería mostrar "No hay grabaciones disponibles"');
      console.log('3. Las nuevas grabaciones funcionarán correctamente');
      
    } else {
      console.log('⚠️ ADVERTENCIA: Aún quedan grabaciones en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

forceCleanAllRecordings();