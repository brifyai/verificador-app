#!/usr/bin/env node

// Script para verificar el estado de una radio específica usando el cliente directo
const { SupabaseDirectClient } = require('../lib/supabase-direct-client.js');

async function checkRadioStatus(radioName) {
  console.log(`🔍 Verificando estado de: ${radioName}`);
  console.log('=====================================\n');

  try {
    const client = new SupabaseDirectClient();
    
    console.log(`🔍 Buscando radio: ${radioName}`);
    
    // Buscar la radio por nombre
    const response = await client.get('radios', {
      name: `ilike.${radioName}`,
      select: '*'
    });

    if (!response || response.length === 0) {
      console.log('❌ Radio no encontrada');
      return;
    }

    const radio = response[0];

    console.log('\n📻 INFORMACIÓN DE LA RADIO:');
    console.log('========================');
    console.log(`ID: ${radio.id}`);
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

checkRadioStatus(radioName);