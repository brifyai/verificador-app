#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuración
const VPS_URL = 'http://213.199.39.147:5000/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔍 INVESTIGANDO ESTRUCTURA DEL VPS DE GRABACIÓN');
console.log('📍 VPS Base URL:', VPS_URL);
console.log('⏰ Fecha actual:', new Date().toISOString());
console.log('');

async function makeRequest(protocol, hostname, port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    const client = protocol === 'https' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 INICIANDO INVESTIGACIÓN DEL VPS');
    console.log('');

    // 1. Obtener grabaciones activas
    console.log('🔍 OBTENIENDO GRABACIONES ACTIVAS');
    console.log('📡 URL:', `${VPS_URL}/active-recordings`);
    
    try {
      const activeRecordings = await makeRequest('http', '213.199.39.147', 5000, '/api/active-recordings');
      console.log('✅ Grabaciones activas obtenidas:');
      console.log(JSON.stringify(activeRecordings.data, null, 2));
    } catch (error) {
      console.log('❌ Error obteniendo grabaciones activas:', error.message);
    }
    
    console.log('');
    
    // 2. Obtener archivos disponibles
    console.log('🔍 OBTENIENDO ARCHIVOS DISPONIBLES');
    console.log('📡 URL:', `${VPS_URL}/recordings`);
    
    try {
      const availableFiles = await makeRequest('http', '213.199.39.147', 5000, '/api/recordings');
      console.log('✅ Archivos disponibles obtenidos:');
      console.log(JSON.stringify(availableFiles.data, null, 2));
    } catch (error) {
      console.log('❌ Error obteniendo archivos disponibles:', error.message);
    }
    
    console.log('');
    
    // 3. Obtener información del sistema
    console.log('🔍 OBTENIENDO INFORMACIÓN DEL SISTEMA');
    console.log('📡 URL:', `${VPS_URL}/system-info`);
    
    try {
      const systemInfo = await makeRequest('http', '213.199.39.147', 5000, '/api/system-info');
      console.log('✅ Información del sistema obtenida:');
      console.log(JSON.stringify(systemInfo.data, null, 2));
    } catch (error) {
      console.log('❌ Error obteniendo información del sistema:', error.message);
    }
    
    console.log('');
    
    // 4. Obtener radios de Supabase para comparar
    console.log('🔍 OBTENIENDO RADIOS DE SUPABASE');
    console.log('📡 URL:', `${SUPABASE_URL}/rest/v1/radios?select=id,name,region,metadata`);
    
    try {
      const radios = await makeRequest('http', SUPABASE_URL.replace('http://', ''), 80, '/rest/v1/radios?select=id,name,region,metadata', {
        'apikey': SUPABASE_ANON_KEY
      });
      console.log('✅ Radios obtenidas de Supabase:');
      console.log(`📊 Total de radios: ${radios.data.length}`);
      console.log('📻 Muestra de radios:');
      console.log(JSON.stringify(radios.data.slice(0, 3), null, 2));
    } catch (error) {
      console.log('❌ Error obteniendo radios de Supabase:', error.message);
    }
    
    console.log('');
    console.log('✅ INVESTIGACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('💥 Error durante la investigación:', error);
  }
}

main();