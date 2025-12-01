const https = require('https');
const http = require('http');

// Configuración de Supabase
const SUPABASE_URL = 'https://mijm9z6hzzz6x5pozx8.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05ejZoenp6Nng1cG96eDgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU5MjQxMCwiZXhwIjoyMDQ4MTY4NDEwfQ.-KpQDzKJNfpodXJtJ3lGSBUmqH1n7g6N6x1z5l7S5uk';

function makeSupabaseRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mijm9z6hzzz6x5pozx8.supabase.co',
      port: 443,
      path: `/rest/v1/${path}`,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: result,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            error: 'Parse error'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function searchRadioByName(name) {
  console.log(`🔍 Buscando radio con nombre: "${name}"`);
  console.log('='.repeat(60));
  
  try {
    // Buscar por coincidencia exacta
    const exactResult = await makeSupabaseRequest(`radios?name=eq.${encodeURIComponent(name)}&select=*`);
    
    if (exactResult.status === 200 && exactResult.data && exactResult.data.length > 0) {
      console.log('✅ Encontrado por coincidencia exacta:');
      exactResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
        console.log(`   🔗 ${radio.stream_url}`);
        console.log(`   🆔 ${radio.id}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return;
    }
    
    // Buscar por coincidencia parcial
    const partialResult = await makeSupabaseRequest(`radios?name=ilike.*${encodeURIComponent(name)}*&select=*`);
    
    if (partialResult.status === 200 && partialResult.data && partialResult.data.length > 0) {
      console.log('✅ Encontrado por coincidencia parcial:');
      partialResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
        console.log(`   🔗 ${radio.stream_url}`);
        console.log(`   🆔 ${radio.id}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return;
    }
    
    // Buscar por stream_url que contenga el nombre
    const urlResult = await makeSupabaseRequest(`radios?stream_url=ilike.*${encodeURIComponent(name.toLowerCase())}*&select=*`);
    
    if (urlResult.status === 200 && urlResult.data && urlResult.data.length > 0) {
      console.log('✅ Encontrado por URL:');
      urlResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
        console.log(`   🔗 ${radio.stream_url}`);
        console.log(`   🆔 ${radio.id}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return;
    }
    
    // Buscar por región si el nombre parece ser una región
    const regionResult = await makeSupabaseRequest(`radios?region=eq.${encodeURIComponent(name)}&select=*`);
    
    if (regionResult.status === 200 && regionResult.data && regionResult.data.length > 0) {
      console.log('✅ Encontrado por región:');
      regionResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
        console.log(`   🔗 ${radio.stream_url}`);
        console.log(`   🆔 ${radio.id}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
      return;
    }
    
    console.log('❌ No se encontró ninguna radio con ese nombre');
    
    // Mostrar algunas radios de ejemplo para verificar que la API funciona
    console.log('');
    console.log('📋 Verificando que la API funciona...');
    const sampleResult = await makeSupabaseRequest('radios?limit=5&select=*');
    
    if (sampleResult.status === 200 && sampleResult.data && sampleResult.data.length > 0) {
      console.log('✅ API funciona correctamente. Algunas radios de ejemplo:');
      sampleResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
      });
    } else {
      console.log('❌ La API no está retornando datos');
      console.log('Estado:', sampleResult.status);
      console.log('Datos:', sampleResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error al buscar la radio:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
  }
}

// Buscar Radio Pilmaiquen
searchRadioByName('Pilmaiquen');

// También buscar por "chiloestreaming" para encontrar todas las radios de esa plataforma
console.log('');
console.log('🔍 Buscando radios con "chiloestreaming" en la URL...');
console.log('='.repeat(60));

setTimeout(async () => {
  try {
    const chiloeResult = await makeSupabaseRequest('radios?stream_url=ilike.*chiloestreaming*&select=*');
    
    if (chiloeResult.status === 200 && chiloeResult.data && chiloeResult.data.length > 0) {
      console.log(`✅ Encontradas ${chiloeResult.data.length} radios de chiloestreaming:`);
      chiloeResult.data.forEach(radio => {
        console.log(`   📻 ${radio.name} (${radio.region})`);
        console.log(`   🔗 ${radio.stream_url}`);
        console.log(`   🆔 ${radio.id}`);
        console.log(`   📊 Estado: ${radio.status}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron radios con "chiloestreaming" en la URL');
    }
  } catch (error) {
    console.error('❌ Error al buscar radios de chiloestreaming:', error.message);
  }
}, 2000);