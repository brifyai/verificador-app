#!/usr/bin/env node

/**
 * Script para ejecutar la verificación masiva de radios
 * Actualiza los estados de todas las radios en la base de datos
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/radios-direct/verify-bulk`;

// Función para leer el token de admin
function getAdminToken() {
  try {
    const tokenPath = path.join(__dirname, 'admin-token.txt');
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error leyendo token de admin:', error.message);
  }
  return null;
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
            data: data ? JSON.parse(data) : null
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
async function ejecutarVerificacionMasiva() {
  try {
    console.log('🚀 Iniciando verificación masiva de radios...');
    console.log('📡 URL del endpoint:', API_URL);
    
    // Obtener token de admin
    const token = getAdminToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de admin. Verifica que exista el archivo admin-token.txt');
    }
    
    console.log('🔑 Token de admin obtenido');
    
    // Configurar headers
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('🔄 Enviando petición de verificación masiva...');
    const startTime = Date.now();
    
    const response = await makeRequest(API_URL, options);
    
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Respuesta recibida en ${duration}ms`);
    console.log(`📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const result = response.data;
      
      if (result.success) {
        console.log('✅ Verificación masiva completada exitosamente!');
        console.log(`📈 Total de radios verificadas: ${result.data.total}`);
        console.log(`🟢 Radios online: ${result.data.online}`);
        console.log(`🔴 Radios offline: ${result.data.offline}`);
        console.log(`📝 Mensaje: ${result.message}`);
        
        // Mostrar algunas radios verificadas como ejemplo
        if (result.data.results && result.data.results.length > 0) {
          console.log('\n📻 Ejemplos de radios verificadas:');
          const ejemplos = result.data.results.slice(0, 5);
          ejemplos.forEach((radio, index) => {
            const statusEmoji = radio.status === 'ONLINE' ? '🟢' : '🔴';
            console.log(`  ${index + 1}. ${statusEmoji} ${radio.radioName} (${radio.region}) - ${radio.status}`);
          });
          
          if (result.data.results.length > 5) {
            console.log(`  ... y ${result.data.results.length - 5} radios más`);
          }
        }
        
        console.log('\n🎉 Los estados de las radios han sido actualizados en la base de datos');
        console.log('💡 Los campos actualizados son:');
        console.log('   - last_verification_status');
        console.log('   - last_verified_at');
        console.log('   - updated_at');
        
      } else {
        console.log('❌ Error en la verificación masiva:', result.error || 'Error desconocido');
      }
    } else {
      console.log(`❌ Error HTTP: ${response.statusCode}`);
      if (response.data) {
        console.log('📄 Respuesta del servidor:', JSON.stringify(response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando verificación masiva:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor esté ejecutándose en el puerto 3000');
      console.log('💡 Ejecuta: cd app && npm run dev');
    }
    
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarVerificacionMasiva();
}

module.exports = { ejecutarVerificacionMasiva };