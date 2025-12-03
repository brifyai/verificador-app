#!/usr/bin/env node

/**
 * VERIFICAR TABLA RECORDINGS EN SUPABASE
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijm9xciplfnpiyqrbuq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpZCI6Im9pZGMifQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05eGNpcGxmbnBpeXFyYnVxIiwicm9sZSI6ImFub24iLCJpbmF0IjoxNzMxNjIzODcyLCJleHAiOjE3MzE2MjM4NzJ9.0rVd8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecordingsTable() {
  console.log('=== VERIFICANDO TABLA RECORDINGS EN SUPABASE ===');
  
  try {
    console.log('1. Obteniendo todas las grabaciones...');
    const { data: recordings, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`   Encontradas: ${recordings.length} grabaciones`);
    
    if (recordings.length > 0) {
      console.log('\n   Últimas grabaciones:');
      recordings.forEach((recording, i) => {
        console.log(`   ${i + 1}.`);
        console.log(`      ID: ${recording.id}`);
        console.log(`      Radio ID: ${recording.radio_id}`);
        console.log(`      Radio Name: ${recording.radio_name || 'N/A'}`);
        console.log(`      Filename: ${recording.filename}`);
        console.log(`      File Size: ${recording.file_size || 'N/A'} bytes`);
        console.log(`      Created: ${recording.created_at}`);
        console.log(`      Recorded At: ${recording.recorded_at || 'N/A'}`);
        console.log('');
      });
      
      // Verificar si hay grabaciones recientes
      const recentRecordings = recordings.filter(rec => {
        const createdAt = new Date(rec.created_at);
        const now = new Date();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);
        return diffHours < 24; // Últimas 24 horas
      });
      
      console.log(`\n2. Grabaciones de las últimas 24 horas: ${recentRecordings.length}`);
      
      if (recentRecordings.length > 0) {
        console.log('   ✅ HAY GRABACIONES RECIENTES');
        recentRecordings.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.filename} (${rec.radio_name || rec.radio_id})`);
        });
      } else {
        console.log('   ❌ NO HAY GRABACIONES RECIENTES');
      }
      
      // Verificar estructura de la tabla
      console.log('\n3. Estructura de la tabla recordings:');
      if (recordings[0]) {
        console.log('   Campos disponibles:');
        Object.keys(recordings[0]).forEach(field => {
          console.log(`   - ${field}: ${typeof recordings[0][field]}`);
        });
      }
      
    } else {
      console.log('   ❌ NO HAY GRABACIONES EN LA TABLA');
    }
    
    // Verificar tabla radios también
    console.log('\n4. Verificando tabla radios...');
    const { data: radios, error: radiosError } = await supabase
      .from('radios')
      .select('id_radio, name, region')
      .limit(10);
    
    if (radiosError) {
      console.error('Error en radios:', radiosError);
    } else {
      console.log(`   Radios en DB: ${radios.length}`);
      radios.forEach((radio, i) => {
        console.log(`   ${i + 1}. ID: "${radio.id_radio}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRecordingsTable();