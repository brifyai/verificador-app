#!/usr/bin/env node

/**
 * Script para verificar las regiones en la base de datos
 * Este script obtiene las regiones directamente de la API
 */

const https = require('https');
const http = require('http');

// Función para hacer peticiones HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función principal
async function checkRegions() {
  console.log('🔍 Verificando regiones en la base de datos...\n');
  
  try {
    // Obtener el token de autenticación de las cookies del navegador
    // Como no podemos acceder directamente a las cookies del navegador desde Node.js,
    // vamos a intentar obtener las radios sin autenticación para ver las regiones
    
    // Primero intentamos obtener las radios sin autenticación
    console.log('Intentando obtener radios sin autenticación...');
    
    try {
      const response = await makeRequest('http://localhost:3000/api/radios-direct?limit=500');
      
      if (response.statusCode === 401) {
        console.log('❌ Requiere autenticación. Obteniendo token...');
        
        // Intentar login con credenciales por defecto
        const loginResponse = await makeRequest('http://localhost:3000/api/auth/login-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@verificador.com',
            password: 'admin123'
          })
        });
        
        if (loginResponse.statusCode === 200 && loginResponse.data.token) {
          const token = loginResponse.data.token;
          console.log('✅ Login exitoso. Token obtenido.');
          
          // Ahora obtener las radios con el token
          const radiosResponse = await makeRequest('http://localhost:3000/api/radios-direct?limit=500', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (radiosResponse.statusCode === 200 && radiosResponse.data.data) {
            analyzeRegions(radiosResponse.data.data);
          } else {
            console.log('❌ Error al obtener radios:', radiosResponse.data);
          }
        } else {
          console.log('❌ Error en login:', loginResponse.data);
        }
      } else if (response.statusCode === 200 && response.data.data) {
        analyzeRegions(response.data.data);
      } else {
        console.log('❌ Error:', response.data);
      }
    } catch (error) {
      console.log('❌ Error de conexión:', error.message);
      console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

function analyzeRegions(radios) {
  console.log(`✅ Se obtuvieron ${radios.length} radios\n`);
  
  // Extraer regiones únicas
  const regions = [...new Set(radios.map(radio => radio.region))];
  console.log('📍 Regiones encontradas en la base de datos:');
  regions.forEach((region, index) => {
    console.log(`  ${index + 1}. "${region}"`);
  });
  
  console.log('\n📊 Resumen:');
  console.log(`  Total de regiones: ${regions.length}`);
  
  // Verificar el orden esperado vs el actual
  console.log('\n🔍 Comparación con el orden esperado:');
  
  // Orden esperado según el código
  const expectedOrder = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana de Santiago',
    'Libertador General Bernardo O\'Higgins',
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén del General Carlos Ibáñez del Campo',
    'Magallanes y de la Antártica Chilena'
  ];
  
  console.log('Orden esperado en el código:');
  expectedOrder.forEach((region, index) => {
    const exists = regions.includes(region);
    const status = exists ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} "${region}"`);
  });
  
  console.log('\n💡 Notas:');
  console.log('  - Las regiones con ❌ no están presentes en la base de datos');
  console.log('  - Las regiones con ✅ están correctamente ordenadas en el código');
  console.log('  - Si ves nombres diferentes, necesitamos actualizar el código para que coincidan');
}

// Ejecutar el script
checkRegions().catch(console.error);