#!/usr/bin/env node

// Script para verificar el estado de una radio específica
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRadioStatus(radioName) {
  console.log(`🔍 Buscando radio: ${radioName}`);
  
  try {
    // Buscar la radio por nombre
    const { data: radio, error } = await supabase
      .from('radios')
      .select('*')
      .ilike('name', `%${radioName}%`)
      .single();

    if (error) {
      console.error('❌ Error al buscar la radio:', error.message);
      return;
    }

    if (!radio) {
      console.log('❌ Radio no encontrada');
      return;
    }

    console.log('\n📻 INFORMACIÓN DE LA RADIO:');
    console.log('========================');
    console.log(`Nombre: ${radio.name}`);
    console.log(`URL: ${radio.url}`);
    console.log(`Estado: ${radio.status}`);
    console.log(`Verificación: ${radio.verification_status}`);
    console.log(`Última verificación: ${radio.last_verification}`);
    console.log(`Plataforma: ${radio.platform}`);
    console.log(`Región: ${radio.region}`);
    console.log(`Activa: ${radio.is_active ? 'Sí' : 'No'}`);

    // Verificar si el estado es ONLINE
    if (radio.status === 'online') {
      console.log('\n✅ ¡LA RADIO ESTÁ ONLINE!');
    } else {
      console.log(`\n⚠️  La radio está: ${radio.status}`);
    }

    // Si hay información adicional de verificación
    if (radio.verification_data) {
      console.log('\n📊 Datos de verificación:');
      console.log(JSON.stringify(radio.verification_data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Obtener el nombre de la radio de los argumentos
const radioName = process.argv[2] || 'Digital FM Arica';

console.log(`\n🔍 Verificando estado de: ${radioName}`);
console.log('=====================================\n');

checkRadioStatus(radioName);