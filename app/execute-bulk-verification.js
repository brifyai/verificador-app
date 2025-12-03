#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

// Configuración
const API_BASE = 'http://localhost:3000';
const ADMIN_TOKEN_FILE = 'admin-token.txt';

// Función para leer el token de admin
function readAdminToken() {
  try {
    const token = fs.readFileSync(ADMIN_TOKEN_FILE, 'utf8').trim();
    return token;
  } catch (error) {
    console.error('❌ Error leyendo token de admin:', error.message);
    return null;
  }
}

// Función para hacer petición HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`Error parseando respuesta: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función principal
async function executeBulkVerification() {
  console.log('🚀 Iniciando verificación masiva de radios...\n');
  
  // Leer token de admin
  const adminToken = readAdminToken();
  if (!adminToken) {
    console.error('❌ No se pudo leer el token de admin. Asegúrate de que existe el archivo admin-token.txt');
    process.exit(1);
  }
  
  console.log('✅ Token de admin leído correctamente');
  
  try {
    // Ejecutar verificación masiva
    console.log('🔄 Ejecutando verificación masiva...');
    
    const response = await makeRequest(`${API_BASE}/api/radios-direct/verify-bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      console.log('\n✅ Verificación masiva completada exitosamente!');
      console.log(`📊 Resultados:`);
      console.log(`   • Total radios verificadas: ${response.data.data.total}`);
      console.log(`   • Radios online: ${response.data.data.online}`);
      console.log(`   • Radios offline: ${response.data.data.offline}`);
      console.log(`   • Mensaje: ${response.data.message}`);
      
      // Mostrar algunas radios como ejemplo
      if (response.data.data.results && response.data.data.results.length > 0) {
        console.log('\n📻 Ejemplos de radios verificadas:');
        response.data.data.results.slice(0, 5).forEach((result, index) => {
          const status = result.status === 'ONLINE' ? '🟢' : '🔴';
          console.log(`   ${index + 1}. ${status} ${result.radioName} (${result.region}) - ${result.status}`);
        });
        
        if (response.data.data.results.length > 5) {
          console.log(`   ... y ${response.data.data.results.length - 5} radios más`);
        }
      }
      
      console.log('\n🎉 ¡Verificación masiva completada! Los estados de las radios han sido actualizados.');
      console.log('💡 Ahora puedes refrescar el dashboard para ver las estadísticas actualizadas.');
      
    } else {
      console.error(`❌ Error en la verificación masiva: ${response.statusCode}`);
      console.error('Respuesta:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando verificación masiva:', error.message);
    console.error('Detalles:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  executeBulkVerification();
}

module.exports = { executeBulkVerification };