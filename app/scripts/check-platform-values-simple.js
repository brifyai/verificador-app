#!/usr/bin/env node

// Script simple para verificar valores válidos del campo platform
const SUPABASE_URL = 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw';

async function checkPlatformValues() {
  console.log('🔍 Obteniendo valores de platform de la base de datos...');
  
  try {
    // Obtener algunos registros para ver los valores de platform
    const response = await fetch(`${SUPABASE_URL}/rest/v1/radios?select=platform&limit=100`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const radios = await response.json();
    console.log(`✅ Se encontraron ${radios.length} radios`);
    
    // Contar valores únicos de platform
    const platformCounts = {};
    radios.forEach(radio => {
      const platform = radio.platform || 'NULL';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    console.log('\n📊 Valores de platform encontrados:');
    Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([platform, count]) => {
        console.log(`  "${platform}": ${count} radios`);
      });

    // También intentemos obtener el esquema de la tabla
    console.log('\n🔍 Intentando obtener el esquema de la tabla...');
    
    // Intentar obtener información sobre la constraint
    const constraintResponse = await fetch(`${SUPABASE_URL}/rest/v1/radios?select=platform&platform=eq.ONLINE&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (constraintResponse.ok) {
      console.log('✅ El valor "ONLINE" parece ser válido según la respuesta');
    } else {
      console.log('❌ El valor "ONLINE" fue rechazado:', constraintResponse.status, constraintResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Error al obtener valores de platform:', error.message);
  }
}

// Ejecutar
checkPlatformValues().catch(console.error);