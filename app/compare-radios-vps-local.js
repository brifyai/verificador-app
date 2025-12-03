// Importar el cliente Supabase Direct ya configurado
// Cargar variables de entorno desde .env
require('dotenv').config({ path: '.env' });

const { supabaseDirect } = require('./lib/supabase-direct');

// Configuración VPS
const VPS_URL = 'http://213.199.39.147:5000';
const VPS_TOKEN = 'default-recording-token-2024';

async function compareRadios() {
  console.log('🔍 Comparando radios entre aplicación local y VPS...\n');

  try {
    // 1. Obtener radios de la aplicación local (Supabase Direct)
    console.log('📡 Obteniendo radios de la aplicación local...');
    
    const localRadios = await supabaseDirect.getRadios({
      limit: 500,
      order: 'name.asc'
    });

    // Filtrar solo radios activas
    const activeLocalRadios = localRadios.filter(radio => radio.status === 'ACTIVE');

    console.log(`✅ Radios locales encontradas: ${localRadios.length}`);
    console.log(`✅ Radios locales activas: ${activeLocalRadios.length}`);
    
    // 2. Obtener radios del VPS
    console.log('\n📡 Obteniendo radios del VPS...');
    const vpsResponse = await fetch(`${VPS_URL}/api/radios`, {
      headers: {
        'Authorization': `Bearer ${VPS_TOKEN}`
      }
    });

    if (!vpsResponse.ok) {
      console.error('❌ Error obteniendo radios del VPS:', vpsResponse.status);
      return;
    }

    const vpsData = await vpsResponse.json();
    const vpsRadios = vpsData.radios || [];
    
    console.log(`✅ Radios VPS encontradas: ${vpsRadios.length}`);

    // 3. Análisis comparativo
    console.log('\n📊 Análisis comparativo:');
    console.log(`- Aplicación local: ${activeLocalRadios.length} radios activas`);
    console.log(`- VPS: ${vpsRadios.length} radios registradas`);

    // 4. Buscar coincidencias por stream_url
    const localStreamUrls = new Set(activeLocalRadios.map(r => r.stream_url));
    const vpsStreamUrls = new Set(vpsRadios.map(r => r.stream_url));
    
    const coincidentes = [...localStreamUrls].filter(url => vpsStreamUrls.has(url));
    const soloLocales = [...localStreamUrls].filter(url => !vpsStreamUrls.has(url));
    const soloVPS = [...vpsStreamUrls].filter(url => !localStreamUrls.has(url));

    console.log(`\n🎯 Coincidencias por stream_url:`);
    console.log(`- Radios en ambos sistemas: ${coincidentes.length}`);
    console.log(`- Solo en aplicación local: ${soloLocales.length}`);
    console.log(`- Solo en VPS: ${soloVPS.length}`);

    // 5. Mostrar ejemplos
    if (soloLocales.length > 0) {
      console.log('\n📋 Ejemplos de radios solo en aplicación local:');
      soloLocales.slice(0, 5).forEach(url => {
        const radio = activeLocalRadios.find(r => r.stream_url === url);
        console.log(`  - ${radio.name} (ID: ${radio.id_radio || radio.id})`);
      });
    }

    if (soloVPS.length > 0) {
      console.log('\n📋 Ejemplos de radios solo en VPS:');
      soloVPS.slice(0, 5).forEach(url => {
        const radio = vpsRadios.find(r => r.stream_url === url);
        console.log(`  - ${radio.name} (ID: ${radio.id_radio})`);
      });
    }

    // 6. Verificar IDs específicos
    console.log('\n🔍 Verificación de IDs específicos:');
    const problematicIds = [11, 22, 2]; // IDs que hemos probado
    
    problematicIds.forEach(id => {
      const localRadio = activeLocalRadios.find(r => (r.id_radio === id || r.id === id));
      const vpsRadio = vpsRadios.find(r => r.id_radio === id);
      
      console.log(`ID ${id}:`);
      console.log(`  - Local: ${localRadio ? `${localRadio.name} ✅` : '❌ No encontrada'}`);
      console.log(`  - VPS: ${vpsRadio ? `${vpsRadio.name} ✅` : '❌ No encontrada'}`);
      
      if (localRadio && vpsRadio) {
        const urlsMatch = localRadio.stream_url === vpsRadio.stream_url;
        console.log(`  - URLs coinciden: ${urlsMatch ? '✅' : '❌'}`);
        if (!urlsMatch) {
          console.log(`    Local: ${localRadio.stream_url}`);
          console.log(`    VPS: ${vpsRadio.stream_url}`);
        }
      }
    });

    // 7. Conclusiones
    console.log('\n📝 Conclusiones:');
    if (coincidentes.length === 0) {
      console.log('❌ No hay coincidencias entre las bases de datos');
      console.log('❌ Las aplicaciones usan diferentes conjuntos de datos');
      console.log('❌ Esto explica por qué el VPS no encuentra las radios');
    } else if (coincidentes.length < localRadios.length * 0.5) {
      console.log('⚠️ Hay pocas coincidencias entre las bases de datos');
      console.log('⚠️ Muchas radios locales no están registradas en el VPS');
    } else {
      console.log('✅ Hay buena coincidencia entre las bases de datos');
      console.log('✅ El problema podría estar en otro lugar');
    }

  } catch (error) {
    console.error('❌ Error en la comparación:', error);
  }
}

// Ejecutar la comparación
compareRadios();