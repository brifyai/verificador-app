const https = require('https');
const http = require('http');

// Token válido desde valid-token.txt
const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY0NTUwOTcyLCJleHAiOjE3NjQ2MzczNzJ9.0O7RzRTVKJ5yTLCs_7H1EBDyt2w2-WJ-37EuZFzY0OY';

// Función para hacer peticiones HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Buscar Radio Pilmaiquen en la base de datos
async function searchRadioPilmaiquen() {
  console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
  console.log('==================================================');
  
  let offset = 0;
  const limit = 100; // Mayor límite para búsqueda más rápida
  let found = false;
  let totalProcessed = 0;
  
  try {
    while (!found) {
      console.log(`📄 Buscando en página ${Math.floor(offset / limit) + 1} (offset: ${offset})...`);
      
      const url = `http://localhost:3000/api/radios-direct?limit=${limit}&offset=${offset}`;
      
      try {
        const response = await makeRequest(url, {
          headers: {
            'Authorization': `Bearer ${VALID_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.statusCode === 401) {
          console.log('❌ Error de autenticación - Token inválido');
          break;
        }
        
        if (response.statusCode !== 200) {
          console.log(`❌ Error HTTP ${response.statusCode}`);
          break;
        }
        
        const radios = response.data;
        
        if (!radios || radios.length === 0) {
          console.log('📄 No hay más radios para procesar');
          break;
        }
        
        console.log(`📄 Encontradas ${radios.length} radios en esta página`);
        
        // Buscar Radio Pilmaiquen
        for (const radio of radios) {
          totalProcessed++;
          
          if (radio.name && radio.name.toLowerCase().includes('pilmaiquen')) {
            console.log('🎉 ¡RADIO PILMAIQUEN ENCONTRADA!');
            console.log('📻 Información de la radio:');
            console.log(`   ID: ${radio.id}`);
            console.log(`   Nombre: ${radio.name}`);
            console.log(`   URL: ${radio.stream_url}`);
            console.log(`   Región: ${radio.region}`);
            console.log(`   Estado: ${radio.status}`);
            console.log(`   Plataforma: ${radio.platform || 'No especificada'}`);
            
            // Guardar información completa
            const fs = require('fs');
            const info = {
              encontrado: true,
              radio: radio,
              timestamp: new Date().toISOString(),
              totalProcesadas: totalProcessed
            };
            
            fs.writeFileSync('radio-pilmaiquen-encontrada.json', JSON.stringify(info, null, 2));
            console.log('💾 Información guardada en radio-pilmaiquen-encontrada.json');
            
            found = true;
            break;
          }
        }
        
        if (!found) {
          offset += limit;
          
          // Pequeña pausa para no sobrecargar el servidor
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.log(`❌ Error en la petición: ${error.message}`);
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ Radio Pilmaiquen no encontrada después de procesar ${totalProcessed} radios`);
      
      // Guardar estadísticas
      const fs = require('fs');
      const stats = {
        encontrado: false,
        totalProcesadas: totalProcessed,
        timestamp: new Date().toISOString(),
        mensaje: 'Radio Pilmaiquen no encontrada en la base de datos'
      };
      
      fs.writeFileSync('radio-pilmaiquen-search-stats.json', JSON.stringify(stats, null, 2));
      console.log('💾 Estadísticas guardadas en radio-pilmaiquen-search-stats.json');
    }
    
    console.log('✅ Búsqueda completada');
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

// Ejecutar la búsqueda
searchRadioPilmaiquen().catch(console.error);