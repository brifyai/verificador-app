const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchQuieroRadios() {
  console.log('🔍 Buscando radios con "Quiero" en el nombre...');
  
  try {
    // Buscar por nombre
    const { data: nameData, error: nameError } = await supabase
      .from('radios')
      .select('*')
      .ilike('name', '%quiero%')
      .order('name', { ascending: true });

    if (nameError) {
      console.error('❌ Error buscando por nombre:', nameError);
    } else if (nameData && nameData.length > 0) {
      console.log(`✅ Encontradas ${nameData.length} radios con "Quiero" en el nombre:`);
      nameData.forEach(radio => {
        console.log(`  📻 ${radio.name} (${radio.region})`);
        console.log(`     ID: ${radio.id}`);
        console.log(`     URL: ${radio.stream_url}`);
        console.log(`     Status: ${radio.last_verification_status}`);
        console.log(`     Plataforma: ${radio.platform}`);
        console.log(`     Última verificación: ${radio.last_verified_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron radios con "Quiero" en el nombre');
    }

    // Buscar por URL (conectaapp.cl)
    console.log('🔍 Buscando radios con "conectaapp.cl" en la URL...');
    
    const { data: urlData, error: urlError } = await supabase
      .from('radios')
      .select('*')
      .ilike('stream_url', '%conectaapp.cl%')
      .order('name', { ascending: true });

    if (urlError) {
      console.error('❌ Error buscando por URL:', urlError);
    } else if (urlData && urlData.length > 0) {
      console.log(`✅ Encontradas ${urlData.length} radios con "conectaapp.cl" en la URL:`);
      urlData.forEach(radio => {
        console.log(`  📻 ${radio.name} (${radio.region})`);
        console.log(`     ID: ${radio.id}`);
        console.log(`     URL: ${radio.stream_url}`);
        console.log(`     Status: ${radio.last_verification_status}`);
        console.log(`     Plataforma: ${radio.platform}`);
        console.log(`     Última verificación: ${radio.last_verified_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron radios con "conectaapp.cl" en la URL');
    }

    // Buscar por región (Antofagasta)
    console.log('🔍 Buscando radios en la región de Antofagasta...');
    
    const { data: regionData, error: regionError } = await supabase
      .from('radios')
      .select('*')
      .ilike('region', '%antofagasta%')
      .order('name', { ascending: true });

    if (regionError) {
      console.error('❌ Error buscando por región:', regionError);
    } else if (regionData && regionData.length > 0) {
      console.log(`✅ Encontradas ${regionData.length} radios en Antofagasta:`);
      regionData.forEach(radio => {
        console.log(`  📻 ${radio.name} (${radio.region})`);
        console.log(`     ID: ${radio.id}`);
        console.log(`     URL: ${radio.stream_url}`);
        console.log(`     Status: ${radio.last_verification_status}`);
        console.log(`     Plataforma: ${radio.platform}`);
        console.log(`     Última verificación: ${radio.last_verified_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron radios en la región de Antofagasta');
    }

    // Buscar específicamente la URL completa
    console.log('🔍 Buscando la URL específica de FM Quiero...');
    
    const targetUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
    
    const { data: exactData, error: exactError } = await supabase
      .from('radios')
      .select('*')
      .eq('stream_url', targetUrl);

    if (exactError) {
      console.error('❌ Error buscando URL exacta:', exactError);
    } else if (exactData && exactData.length > 0) {
      console.log(`✅ Encontrada la radio con la URL exacta:`);
      exactData.forEach(radio => {
        console.log(`  📻 ${radio.name} (${radio.region})`);
        console.log(`     ID: ${radio.id}`);
        console.log(`     URL: ${radio.stream_url}`);
        console.log(`     Status: ${radio.last_verification_status}`);
        console.log(`     Plataforma: ${radio.platform}`);
        console.log(`     Última verificación: ${radio.last_verified_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontró la radio con la URL exacta proporcionada');
      
      // Buscar con una versión más corta de la URL
      console.log('🔍 Buscando con una versión más corta de la URL...');
      
      const shortUrl = 'https://streaming-secure.conectaapp.cl/fmquiero.cl';
      
      const { data: shortData, error: shortError } = await supabase
        .from('radios')
        .select('*')
        .ilike('stream_url', `${shortUrl}%`);

      if (shortError) {
        console.error('❌ Error buscando URL corta:', shortError);
      } else if (shortData && shortData.length > 0) {
        console.log(`✅ Encontradas ${shortData.length} radios con URL que comienza con "${shortUrl}":`);
        shortData.forEach(radio => {
          console.log(`  📻 ${radio.name} (${radio.region})`);
          console.log(`     ID: ${radio.id}`);
          console.log(`     URL: ${radio.stream_url}`);
          console.log(`     Status: ${radio.last_verification_status}`);
          console.log(`     Plataforma: ${radio.platform}`);
          console.log(`     Última verificación: ${radio.last_verified_at}`);
          console.log('');
        });
      } else {
        console.log('❌ No se encontraron radios con URL que comience con el patrón buscado');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

searchQuieroRadios();