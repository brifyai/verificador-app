#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verificando radios en la base de datos...');

// Configuración de Supabase
const supabaseUrl = 'https://gdlfngqkmqpxlqfpkqdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbGZucWdrbXFweGxxZnBrcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MTc5MTIsImV4cCI6MjA1MDE5MzkxMn0.4n8e8m3c5l9q2d6f8r1s5w7x9z0a2b4c6d8e0f2g4h6i8j0k2l4m6n8o0p2q4r6s8t0u2v4w6x8y0z2a4b6c8d0e2f4g6h8i0j';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRadios() {
  try {
    console.log('📡 Consultando tabla radios...');
    
    // Obtener todas las radios
    const { data: radios, error } = await supabase
      .from('radios')
      .select('id_radio, name, region, description, platform, status, vps_id')
      .order('name');
    
    if (error) {
      console.error('❌ Error consultando radios:', error);
      return;
    }
    
    console.log(`✅ Encontradas ${radios.length} radios en la base de datos:`);
    console.log('=' * 80);
    
    radios.forEach((radio, index) => {
      console.log(`${index + 1}. ID: ${radio.id_radio} | Nombre: ${radio.name}`);
      console.log(`   Región: ${radio.region} | Ciudad: ${radio.description}`);
      console.log(`   Plataforma: ${radio.platform} | Status: ${radio.status}`);
      console.log(`   VPS ID: ${radio.vps_id || 'No configurado'}`);
      console.log('-' * 80);
    });
    
    // Buscar específicamente Radio Primavera de Arica
    console.log('\n🔍 Buscando Radio Primavera de Arica...');
    const primaveraRadio = radios.find(radio => 
      radio.name.toLowerCase().includes('primavera') || 
      radio.name.toLowerCase().includes('arica') ||
      radio.description.toLowerCase().includes('arica')
    );
    
    if (primaveraRadio) {
      console.log('✅ Radio Primavera de Arica encontrada:');
      console.log(`   ID: ${primaveraRadio.id_radio}`);
      console.log(`   Nombre: ${primaveraRadio.name}`);
      console.log(`   Región: ${primaveraRadio.region}`);
      console.log(`   Ciudad: ${primaveraRadio.description}`);
      console.log(`   VPS ID: ${primaveraRadio.vps_id || 'No configurado'}`);
    } else {
      console.log('❌ Radio Primavera de Arica NO encontrada en la base de datos');
      console.log('\n💡 Posibles soluciones:');
      console.log('1. La radio no está configurada en el sistema');
      console.log('2. El nombre es diferente al esperado');
      console.log('3. Necesita ser agregada a la base de datos');
    }
    
    // Verificar mapeo VPS actual
    console.log('\n📋 Mapeo VPS actual en el código:');
    const vpsMap = {
      'mijm9xci': '1', // Radio Contagio
      'mijm9xsi': '2', // Radio Pilmaiquen
    };
    
    Object.entries(vpsMap).forEach(([vpsId, dbId]) => {
      const radio = radios.find(r => r.id_radio === parseInt(dbId));
      if (radio) {
        console.log(`   VPS ${vpsId} → DB ${dbId} (${radio.name})`);
      } else {
        console.log(`   VPS ${vpsId} → DB ${dbId} (Radio no encontrada)`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkRadios();