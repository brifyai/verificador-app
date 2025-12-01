const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function diagnoseRadioDifferences() {
  console.log('🔍 DIAGNÓSTICO: Comparación entre radios Fmmas y Fmokey usando API local\n');

  try {
    // Obtener lista de radios
    console.log('📡 Obteniendo lista de radios...');
    const response = await axios.get(`${API_BASE}/radios-direct?limit=500`);
    const radios = response.data.data;

    console.log(`✅ Encontradas ${radios.length} radios en total\n`);

    // Buscar Fmmas y Fmokey
    const fmmas = radios.find(radio => 
      radio.name && radio.name.toLowerCase().includes('fmmas')
    );
    
    const fmokey = radios.find(radio => 
      radio.name && radio.name.toLowerCase().includes('fmokey')
    );

    if (!fmmas) {
      console.log('❌ No se encontró la radio Fmmas');
    } else {
      console.log('✅ Fmmas encontrada:');
      console.log('   ID:', fmmas.id);
      console.log('   Nombre:', fmmas.name);
      console.log('   Plataforma:', fmmas.streamPlatform);
      console.log('   URL:', fmmas.streamUrl);
      console.log('   Activa:', fmmas.isActive);
      console.log('   Última verificación:', fmmas.lastVerificationStatus);
      console.log('   Metadata:', JSON.stringify(fmmas.metadata, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    if (!fmokey) {
      console.log('❌ No se encontró la radio Fmokey');
    } else {
      console.log('✅ Fmokey encontrada:');
      console.log('   ID:', fmokey.id);
      console.log('   Nombre:', fmokey.name);
      console.log('   Plataforma:', fmokey.streamPlatform);
      console.log('   URL:', fmokey.streamUrl);
      console.log('   Activa:', fmokey.isActive);
      console.log('   Última verificación:', fmokey.lastVerificationStatus);
      console.log('   Metadata:', JSON.stringify(fmokey.metadata, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Si ambas existen, comparar
    if (fmmas && fmokey) {
      console.log('📊 COMPARACIÓN DETALLADA:\n');

      // Comparar campos básicos
      const fields = ['id', 'name', 'streamPlatform', 'streamUrl', 'isActive', 'region', 'genre', 'lastVerificationStatus'];
      fields.forEach(field => {
        const fmmasValue = fmmas[field];
        const fmokeyValue = fmokey[field];
        const isEqual = JSON.stringify(fmmasValue) === JSON.stringify(fmokeyValue);
        
        console.log(`${field}:`);
        console.log(`  Fmmas: ${JSON.stringify(fmmasValue)}`);
        console.log(`  Fmokey: ${JSON.stringify(fmokeyValue)}`);
        console.log(`  Iguales: ${isEqual ? '✅' : '❌'}\n`);
      });

      // Comparar metadata
      console.log('Metadata comparison:');
      const fmmasMeta = fmmas.metadata || {};
      const fmokeyMeta = fmokey.metadata || {};
      
      const allMetaKeys = new Set([...Object.keys(fmmasMeta), ...Object.keys(fmokeyMeta)]);
      
      allMetaKeys.forEach(key => {
        const fmmasValue = fmmasMeta[key];
        const fmokeyValue = fmokeyMeta[key];
        const isEqual = JSON.stringify(fmmasValue) === JSON.stringify(fmokeyValue);
        
        console.log(`  ${key}:`);
        console.log(`    Fmmas: ${JSON.stringify(fmmasValue)}`);
        console.log(`    Fmokey: ${JSON.stringify(fmokeyValue)}`);
        console.log(`    Iguales: ${isEqual ? '✅' : '❌'}\n`);
      });

      // Verificar validación de URL
      console.log('🔍 VALIDACIÓN DE URLS:');
      console.log('Fmmas URL:', fmmas.streamUrl);
      console.log('Fmokey URL:', fmokey.streamUrl);
      
      // Verificar si hay caracteres especiales o problemas de encoding
      const fmmasHasSpecialChars = /[^\x00-\x7F]/.test(fmmas.streamUrl);
      const fmokeyHasSpecialChars = /[^\x00-\x7F]/.test(fmokey.streamUrl);
      
      console.log('Fmmas tiene caracteres especiales:', fmmasHasSpecialChars);
      console.log('Fmokey tiene caracteres especiales:', fmokeyHasSpecialChars);

      // Verificar longitud
      console.log('Fmmas URL longitud:', fmmas.streamUrl.length);
      console.log('Fmokey URL longitud:', fmokey.streamUrl.length);

      // Verificar estructura de plataforma
      console.log('\n🏗️ PLATAFORMA ANALYSIS:');
      console.log('Fmmas plataforma:', fmmas.streamPlatform);
      console.log('Fmokey plataforma:', fmokey.streamPlatform);
      
      const validPlatforms = ['youtube', 'shoutcast', 'icecast', 'other'];
      console.log('Fmmas plataforma válida:', validPlatforms.includes(fmmas.streamPlatform));
      console.log('Fmokey plataforma válida:', validPlatforms.includes(fmokey.streamPlatform));

      // Verificar características específicas que podrían causar problemas
      console.log('\n🔍 CARACTERÍSTICAS QUE PODRÍAN CAUSAR PROBLEMAS:');
      
      // 1. Verificar si el ID tiene caracteres especiales
      console.log('Fmmas ID tiene caracteres especiales:', /[^a-zA-Z0-9-_]/.test(fmmas.id));
      console.log('Fmokey ID tiene caracteres especiales:', /[^a-zA-Z0-9-_]/.test(fmokey.id));
      
      // 2. Verificar longitud del ID
      console.log('Fmmas ID longitud:', fmmas.id.length);
      console.log('Fmokey ID longitud:', fmokey.id.length);
      
      // 3. Verificar si el nombre tiene caracteres especiales
      console.log('Fmmas nombre tiene caracteres especiales:', /[^a-zA-Z0-9\s-_]/.test(fmmas.name));
      console.log('Fmokey nombre tiene caracteres especiales:', /[^a-zA-Z0-9\s-_]/.test(fmokey.name));

      // 4. Verificar si hay alguna diferencia en la estructura que pueda causar problemas
      console.log('\n🔍 ANÁLISIS DE PROBLEMAS POTENCIALES:');
      
      // IDs con caracteres problemáticos
      const problematicChars = /[.#$[\]]/;
      console.log('Fmmas ID tiene caracteres problemáticos:', problematicChars.test(fmmas.id));
      console.log('Fmokey ID tiene caracteres problemáticos:', problematicChars.test(fmokey.id));
      
      // URLs muy largas
      console.log('Fmmas URL es muy larga (>500):', fmmas.streamUrl.length > 500);
      console.log('Fmokey URL es muy larga (>500):', fmokey.streamUrl.length > 500);
      
      // Metadata con valores nulos o undefined
      console.log('Fmmas metadata tiene valores nulos:', Object.values(fmmasMeta).some(v => v === null));
      console.log('Fmokey metadata tiene valores nulos:', Object.values(fmokeyMeta).some(v => v === null));
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

diagnoseRadioDifferences();