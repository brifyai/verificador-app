#!/usr/bin/env node

// Script para verificar manualmente una radio específica
const http = require('http');

async function verifyRadioByUrl(radioUrl) {
  console.log(`🔍 Verificando radio con URL: ${radioUrl}`);
  console.log('=====================================\n');

  try {
    // Usar el endpoint de verificación directa
    const postData = JSON.stringify({
      url: radioUrl,
      timeout: 10000
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/radios-direct/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('📊 RESULTADO DE VERIFICACIÓN:');
            console.log('=============================');
            console.log(`URL: ${radioUrl}`);
            console.log(`Estado: ${result.status}`);
            console.log(`¿Está Online?: ${result.is_online ? 'SÍ' : 'NO'}`);
            console.log(`Método usado: ${result.method}`);
            console.log(`Tiempo de respuesta: ${result.response_time}ms`);
            
            if (result.error) {
              console.log(`Error: ${result.error}`);
            }
            
            if (result.status_code) {
              console.log(`Código HTTP: ${result.status_code}`);
            }
            
            if (result.headers) {
              console.log(`Content-Type: ${result.headers['content-type']}`);
            }

            if (result.is_online) {
              console.log('\n✅ ¡LA RADIO ESTÁ ONLINE!');
            } else {
              console.log(`\n⚠️  La radio está: ${result.status}`);
            }

            resolve(result);
          } catch (parseError) {
            console.error('❌ Error al parsear respuesta:', parseError.message);
            console.log('Respuesta cruda:', data);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error en la solicitud:', error.message);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Obtener la URL de la radio de los argumentos
const radioUrl = process.argv[2] || 'https://radio.digitalfm.cl:8000/arica';

verifyRadioByUrl(radioUrl);