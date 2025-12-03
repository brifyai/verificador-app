#!/usr/bin/env node

/**
 * VERIFICAR RADIOS EN LA BASE DE DATOS
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijm9xciplfnpiyqrbuq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpZCI6Im9pZGMifQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05eGNpcGxmbnBpeXFyYnVxIiwicm9sZSI6ImFub24iLCJpbmF0IjoxNzMxNjIzODcyLCJleHAiOjE3MzE2MjM4NzJ9.0rVd8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRadios() {
  console.log('=== VERIFICANDO RADIOS EN BASE DE DATOS ===');
  
  try {
    console.log('1. Obteniendo todas las radios...');
    const { data: radios, error } = await supabase
      .from('radios')
      .select('id, name, region')
      .order('name');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`   Encontradas: ${radios.length} radios`);
    console.log('\n   Primeras 20 radios:');
    
    radios.slice(0, 20).forEach((radio, i) => {
      console.log(`   ${i + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
    });
    
    if (radios.length > 20) {
      console.log(`   ... y ${radios.length - 20} radios más`);
    }
    
    // Buscar específicamente las radios que deberían tener mapeo
    console.log('\n2. Buscando radios específicas...');
    const targetRadios = radios.filter(r => 
      r.id.includes('mijm9xci') || 
      r.id.includes('mijm9xsi') ||
      r.name.toLowerCase().includes('contagio') ||
      r.name.toLowerCase().includes('digital') ||
      r.name.toLowerCase().includes('somos')
    );
    
    if (targetRadios.length > 0) {
      console.log('   Radios encontradas que necesitan mapeo:');
      targetRadios.forEach((radio, i) => {
        console.log(`   ${i + 1}. ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
      });
    } else {
      console.log('   ❌ No se encontraron radios con IDs alfanuméricos');
    }
    
    // Mostrar mapeo actual
    console.log('\n3. Mapeo actual en use-recording.ts:');
    const currentMapping = {
      'digital-fm-arica': 2,
      'radio-contagio': 80,
      'radio-somos-petorca': 85,
    };
    
    Object.entries(currentMapping).forEach(([localId, vpsId]) => {
      const radio = radios.find(r => r.id === localId);
      if (radio) {
        console.log(`   ✅ "${localId}" -> ${vpsId} (${radio.name})`);
      } else {
        console.log(`   ❌ "${localId}" -> ${vpsId} (NO ENCONTRADA EN DB)`);
      }
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRadios();