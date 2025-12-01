const { createClient } = require('@supabase/supabase-js');

// Usar el método directo con el token
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function findPilmaiquenWithToken() {
  console.log('🔍 Buscando Radio Pilmaiquen con autenticación directa...\n');

  try {
    // Primero obtener el token válido
    const fs = require('fs');
    const token = fs.readFileSync('./admin-token.txt', 'utf8').trim();
    
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    // Buscar por nombre usando el endpoint directo
    const searchResponse = await fetch(`http://localhost:3000/api/radios-direct?search=pilmaiquen`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Búsqueda exitosa:', searchData);
      
      if (searchData.radios && searchData.radios.length > 0) {
        const radio = searchData.radios[0];
        console.log('🎯 Radio Pilmaiquen encontrada:');
        console.log(`   📻 ID: ${radio.id}`);
        console.log(`   📛 Nombre: ${radio.name}`);
        console.log(`   🔗 URL actual: ${radio.stream_url}`);
        console.log(`   🌍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        
        return radio;
      }
    }

    // Si no se encuentra por búsqueda, buscar todas y filtrar
    console.log('🔍 Buscando en todas las radios...');
    const allResponse = await fetch(`http://localhost:3000/api/radios-direct?limit=500`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`📊 Total de radios: ${allData.radios.length}`);
      
      const pilmaiquen = allData.radios.find(radio => 
        radio.name.toLowerCase().includes('pilmaiquen') ||
        radio.stream_url.includes('10977') ||
        radio.stream_url.includes('chiloestreaming.com')
      );

      if (pilmaiquen) {
        console.log('🎯 Radio Pilmaiquen encontrada:');
        console.log(`   📻 ID: ${pilmaiquen.id}`);
        console.log(`   📛 Nombre: ${pilmaiquen.name}`);
        console.log(`   🔗 URL actual: ${pilmaiquen.stream_url}`);
        console.log(`   🌍 Región: ${pilmaiquen.region}`);
        console.log(`   📊 Estado: ${pilmaiquen.status}`);
        
        return pilmaiquen;
      }
    }

    console.log('❌ No se encontró Radio Pilmaiquen');
    return null;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

// Ejecutar
findPilmaiquenWithToken().then(radio => {
  if (radio) {
    console.log('\n📝 Script para actualizar:');
    console.log(`UPDATE radios SET stream_url = 'https://streaming.chiloestreaming.com:10976/' WHERE id = '${radio.id}';`);
    
    console.log('\n🔄 O actualiza directamente con:');
    console.log(`curl -X PUT http://localhost:3000/api/radios/${radio.id} \\`);
    console.log(`  -H "Authorization: Bearer $(cat admin-token.txt)" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"stream_url": "https://streaming.chiloestreaming.com:10976/"}'`);
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});