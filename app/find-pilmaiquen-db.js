const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findPilmaiquen() {
  console.log('🔍 Buscando Radio Pilmaiquen en la base de datos...\n');

  try {
    // Buscar por nombre
    const { data: byName, error: nameError } = await supabase
      .from('radios')
      .select('id, name, stream_url, region, status')
      .ilike('name', '%pilmaiquen%');

    if (nameError) {
      console.log('❌ Error buscando por nombre:', nameError.message);
    } else if (byName && byName.length > 0) {
      console.log('✅ Radio Pilmaiquen encontrada por nombre:');
      byName.forEach(radio => {
        console.log(`   📻 ID: ${radio.id}`);
        console.log(`   📛 Nombre: ${radio.name}`);
        console.log(`   🔗 URL actual: ${radio.stream_url}`);
        console.log(`   🌍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return byName[0];
    }

    // Buscar por URL actual
    const { data: byUrl, error: urlError } = await supabase
      .from('radios')
      .select('id, name, stream_url, region, status')
      .eq('stream_url', 'https://streaming.chiloestreaming.com:10977/');

    if (urlError) {
      console.log('❌ Error buscando por URL:', urlError.message);
    } else if (byUrl && byUrl.length > 0) {
      console.log('✅ Radio encontrada por URL actual:');
      byUrl.forEach(radio => {
        console.log(`   📻 ID: ${radio.id}`);
        console.log(`   📛 Nombre: ${radio.name}`);
        console.log(`   🔗 URL actual: ${radio.stream_url}`);
        console.log(`   🌍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return byUrl[0];
    }

    // Buscar por dominio
    const { data: byDomain, error: domainError } = await supabase
      .from('radios')
      .select('id, name, stream_url, region, status')
      .ilike('stream_url', '%streaming.chiloestreaming.com%');

    if (domainError) {
      console.log('❌ Error buscando por dominio:', domainError.message);
    } else if (byDomain && byDomain.length > 0) {
      console.log('✅ Radios encontradas en el dominio chiloestreaming:');
      byDomain.forEach(radio => {
        console.log(`   📻 ID: ${radio.id}`);
        console.log(`   📛 Nombre: ${radio.name}`);
        console.log(`   🔗 URL: ${radio.stream_url}`);
        console.log(`   🌍 Región: ${radio.region}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return byDomain.find(r => r.name.toLowerCase().includes('pilmaiquen'));
    }

    console.log('❌ No se encontró Radio Pilmaiquen en la base de datos');
    return null;

  } catch (error) {
    console.log('❌ Error general:', error.message);
    return null;
  }
}

// Ejecutar
findPilmaiquen().then(radio => {
  if (radio) {
    console.log('📝 Script para actualizar:');
    console.log(`UPDATE radios SET stream_url = 'https://streaming.chiloestreaming.com:10976/' WHERE id = '${radio.id}';`);
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});