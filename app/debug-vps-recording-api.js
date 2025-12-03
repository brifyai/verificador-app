#!/usr/bin/env node

/**
 * DEBUGGING DEL VPS - VERIFICAR DIFERENTES ENDPOINTS DE GRABACIÓN
 */

async function debugVPSRecordingAPI() {
  console.log('=== DEBUGGING VPS RECORDING API ===');
  
  try {
    // 1. Verificar qué endpoints están disponibles
    console.log('1. Verificando endpoints disponibles...');
    
    const endpoints = [
      '/api/start-recording',
      '/api/record/start',
      '/api/recording/start',
      '/start-recording',
      '/record',
      '/api/v1/start-recording',
      '/api/recording'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nProbando endpoint: ${endpoint}`);
        const response = await fetch(`http://213.199.39.147:5000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            radio_id: 14,
            duration: 5,
            format: 'mp3'
          })
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, await response.text().substring(0, 200));
        
        if (response.status !== 404) {
          console.log(`   ✅ Endpoint encontrado: ${endpoint}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    // 2. Verificar si hay documentación de la API
    console.log('\n\n2. Verificando documentación de la API...');
    try {
      const docResponse = await fetch('http://213.199.39.147:5000/api/docs');
      console.log('   /api/docs status:', docResponse.status);
      
      const helpResponse = await fetch('http://213.199.39.147:5000/api/help');
      console.log('   /api/help status:', helpResponse.status);
      
      const statusResponse = await fetch('http://213.199.39.147:5000/api/status');
      console.log('   /api/status status:', statusResponse.status);
      
    } catch (err) {
      console.log('   No hay documentación disponible');
    }
    
    // 3. Verificar si el problema es el formato del request
    console.log('\n\n3. Probando diferentes formatos de request...');
    
    const testFormats = [
      {
        name: 'Formato actual',
        body: { radio_id: 14, duration: 5, format: 'mp3' }
      },
      {
        name: 'Con string radio_id',
        body: { radio_id: '14', duration: 5, format: 'mp3' }
      },
      {
        name: 'Con id en lugar de radio_id',
        body: { id: 14, duration: 5, format: 'mp3' }
      },
      {
        name: 'Con station_id',
        body: { station_id: 14, duration: 5, format: 'mp3' }
      },
      {
        name: 'Solo radio_id',
        body: { radio_id: 14 }
      }
    ];
    
    for (const testFormat of testFormats) {
      console.log(`\nProbando: ${testFormat.name}`);
      try {
        const response = await fetch('http://213.199.39.147:5000/api/start-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testFormat.body)
        });
        
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result);
        
        if (response.ok) {
          console.log(`   ✅ ¡FORMATO CORRECTO ENCONTRADO: ${testFormat.name}!`);
          break;
        }
      } catch (err) {
        console.log(`   Error: ${err.message}`);
      }
    }
    
    // 4. Verificar si necesitamos autenticación
    console.log('\n\n4. Probando con autenticación...');
    
    const authTests = [
      {
        name: 'Sin auth',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Con API Key',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        }
      },
      {
        name: 'Con X-API-Key',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key'
        }
      }
    ];
    
    for (const authTest of authTests) {
      console.log(`\nProbando: ${authTest.name}`);
      try {
        const response = await fetch('http://213.199.39.147:5000/api/start-recording', {
          method: 'POST',
          headers: authTest.headers,
          body: JSON.stringify({ radio_id: 14, duration: 5, format: 'mp3' })
        });
        
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result.message || result);
        
      } catch (err) {
        console.log(`   Error: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('Error general:', err.message);
  }
}

debugVPSRecordingAPI();