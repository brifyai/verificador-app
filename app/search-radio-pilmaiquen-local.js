const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración para API local
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkB2ZXJpZmljYWRvci5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwNTI4MDAsImV4cCI6MTczNTY0NDgwMH0.G0nJBJqQVB7Knr7g-aXvo_wG2T7k5bNUy4VZgQ2XfLk';

// Función para hacer peticiones HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000
    };

    const req = client.request(reqOptions, (res) => {
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
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Función para buscar Radio Pilmaiquen
async function searchRadioPilmaiquen() {
  console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
  console.log('='.repeat(50));
  
  let offset = 0;
  const limit = 50;
  let found = false;
  let totalProcessed = 0;
  
  try {
    while (!found && totalProcessed < 10000) { // Límite de seguridad
      console.log(`📄 Buscando en página ${Math.floor(offset / limit) + 1} (offset: ${offset})...`);
      
      const url = `${API_BASE_URL}/radios-direct?limit=${limit}&offset=${offset}`;
      
      try {
        const response = await makeRequest(url);
        
        if (response.statusCode !== 200) {
          console.log(`❌ Error HTTP ${response.statusCode}`);
          break;
        }
        
        const radios = response.data;
        
        if (!Array.isArray(radios) || radios.length === 0) {
          console.log('📄 No hay más radios en la base de datos');
          break;
        }
        
        console.log(`📄 Encontradas ${radios.length} radios en esta página`);
        
        // Buscar Radio Pilmaiquen en esta página
        for (const radio of radios) {
          totalProcessed++;
          
          if (radio.name && radio.name.toLowerCase().includes('pilmaiquen')) {
            console.log('🎉 ¡RADIO PILMAIQUEN ENCONTRADA!');
            console.log('='.repeat(50));
            console.log(`📻 Nombre: ${radio.name}`);
            console.log(`🆔 ID: ${radio.id}`);
            console.log(`🌐 URL: ${radio.stream_url}`);
            console.log(`📍 Región: ${radio.region}`);
            console.log(`📊 Estado: ${radio.status}`);
            console.log(`🔍 Plataforma: ${radio.platform || 'No especificada'}`);
            console.log('='.repeat(50));
            
            // Guardar resultados en archivo
            const results = {
              found: true,
              radio: radio,
              timestamp: new Date().toISOString(),
              searchStats: {
                totalProcessed: totalProcessed,
                pagesProcessed: Math.floor(offset / limit) + 1
              }
            };
            
            fs.writeFileSync('radio-pilmaiquen-found.json', JSON.stringify(results, null, 2));
            console.log('💾 Resultados guardados en radio-pilmaiquen-found.json');
            
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
        console.log(`❌ Error procesando página: ${error.message}`);
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ Radio Pilmaiquen no encontrada después de procesar ${totalProcessed} radios`);
      
      // Guardar estadísticas de búsqueda
      const results = {
        found: false,
        timestamp: new Date().toISOString(),
        searchStats: {
          totalProcessed: totalProcessed,
          pagesProcessed: Math.floor(offset / limit)
        }
      };
      
      fs.writeFileSync('radio-pilmaiquen-search-stats.json', JSON.stringify(results, null, 2));
      console.log('💾 Estadísticas guardadas en radio-pilmaiquen-search-stats.json');
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
  
  console.log('✅ Búsqueda completada');
}

// Ejecutar búsqueda
searchRadioPilmaiquen().catch(console.error);