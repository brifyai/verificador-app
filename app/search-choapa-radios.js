const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function searchChoapaRadios() {
  console.log('🔍 Buscando radios relacionadas con Choapa/Illapel...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Buscar todas las radios activas
    const { data: allRadios, error } = await supabase
      .from('radios')
      .select('id, name, stream_url, last_verification_status, last_verified_at, platform, region')
      .eq('status', 'ACTIVE')
      .order('name');
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (allRadios && allRadios.length > 0) {
      console.log(`📊 Total de radios activas: ${allRadios.length}`);
      
      // Buscar radios que puedan estar relacionadas con Choapa/Illapel
      const possibleMatches = allRadios.filter(radio => {
        const name = radio.name?.toLowerCase() || '';
        const url = radio.stream_url?.toLowerCase() || '';
        const region = radio.region?.toLowerCase() || '';
        
        return name.includes('choapa') ||
               name.includes('illapel') ||
               name.includes('tunzilla') ||
               url.includes('cast.tunzilla.com') ||
               url.includes('sonic.portalfoxmix') ||
               region.includes('coquimbo') ||
               region.includes('atacama');
      });
      
      if (possibleMatches.length > 0) {
        console.log('\n🎯 Posibles radios relacionadas con Choapa/Illapel:');
        possibleMatches.forEach(radio => {
          console.log('\n  ID:', radio.id);
          console.log('  Nombre:', radio.name);
          console.log('  Región:', radio.region);
          console.log('  URL:', radio.stream_url);
          console.log('  Estado:', radio.last_verification_status);
          console.log('  Plataforma:', radio.platform);
          console.log('  Última verificación:', radio.last_verified_at);
        });
      } else {
        console.log('\nℹ️ No se encontraron radios relacionadas con Choapa/Illapel');
      }
      
      // Mostrar algunas radios de ejemplo para ver la estructura
      console.log('\n📻 Ejemplo de radios en el sistema:');
      allRadios.slice(0, 5).forEach(radio => {
        console.log(`  - ${radio.name} (${radio.region}): ${radio.stream_url?.substring(0, 50)}...`);
      });
      
    } else {
      console.log('ℹ️ No hay radios activas en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

searchChoapaRadios();