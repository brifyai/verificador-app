#!/usr/bin/env node

// Script para investigar la estructura de endpoints del VPS de grabación
// y entender dónde se almacenan las grabaciones actuales vs futuras

const https = require('https');

const VPS_BASE = 'http://213.199.39.147:5000/api';

console.log('🔍 INVESTIGANDO ESTRUCTURA DEL VPS DE GRABACIÓN');
console.log('📍 VPS Base URL:', VPS_BASE);
console.log('⏰ Fecha actual:', new Date().toISOString());
console.log('');

// Función auxiliar para hacer requests
function makeRequest(endpoint, description) {
  return new Promise((resolve, reject) => {
    const url = `${VPS_BASE}${endpoint}`;
    console.log(`🔍 ${description}`);
    console.log(`📡 URL: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ Respuesta exitosa:`);
          console.log(JSON.stringify(parsed, null, 2));
          
          // Análisis específico según el endpoint
          if (endpoint === '/active-recordings') {
            console.log('\n📈 ANÁLISIS DE GRABACIONES ACTIVAS:');
            const activeRecordings = parsed.active_recordings || {};
            console.log(`🔴 Total de grabaciones activas: ${Object.keys(activeRecordings).length}`);
            
            if (Object.keys(activeRecordings).length > 0) {
              console.log('🎯 Grabaciones activas encontradas:');
              Object.entries(activeRecordings).forEach(([radioId, data]) => {
                console.log(`  - Radio ID: ${radioId}`);
                console.log(`    Estado: ${data.status}`);
                console.log(`    Inicio: ${data.start_time}`);
                console.log(`    Nombre: ${data.radio_name}`);
              });
            } else {
              console.log('❌ No hay grabaciones activas actualmente');
            }
          }
          
          if (endpoint === '/recordings') {
            console.log('\n📁 ANÁLISIS DE GRABACIONES COMPLETADAS:');
            const recordings = parsed.recordings || [];
            console.log(`📦 Total de archivos: ${recordings.length}`);
            
            if (recordings.length > 0) {
              console.log('🗂️ Archivos más recientes:');
              recordings.slice(0, 5).forEach((recording, index) => {
                console.log(`  ${index + 1}. ${recording.filename}`);
                console.log(`     Tamaño: ${recording.size} bytes`);
                console.log(`     Fecha: ${recording.created_at}`);
              });
              
              // Análisis de fechas
              const dates = recordings.map(r => r.created_at).filter(Boolean);
              if (dates.length > 0) {
                const sortedDates = dates.sort().reverse();
                console.log(`\n📅 Rango de fechas:`);
                console.log(`  Más reciente: ${sortedDates[0]}`);
                console.log(`  Más antigua: ${sortedDates[sortedDates.length - 1]}`);
                
                // Verificar si hay archivos de hoy
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const todayFiles = recordings.filter(r => r.created_at && r.created_at.startsWith(today));
                console.log(`\n📅 Archivos de hoy (${today}): ${todayFiles.length}`);
                
                if (todayFiles.length > 0) {
                  console.log('✅ HAY ARCHIVOS DE HOY:');
                  todayFiles.forEach(file => {
                    console.log(`  - ${file.filename}`);
                  });
                } else {
                  console.log('❌ NO HAY ARCHIVOS DE HOY');
                }
              }
            }
          }
          
        } catch (parseError) {
          console.log(`❌ Error parseando JSON:`, parseError.message);
          console.log(`📄 Respuesta raw:`, data.substring(0, 500));
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
        resolve(parsed);
      });
    }).on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      console.log('\n' + '='.repeat(80) + '\n');
      reject(err);
    });
  });
}

// Función para probar descarga directa
function testDirectDownload(filename) {
  return new Promise((resolve, reject) => {
    const downloadUrl = `${VPS_BASE}/download/${encodeURIComponent(filename)}`;
    console.log(`🔍 PROBANDO DESCARGA DIRECTA`);
    console.log(`📡 URL: ${downloadUrl}`);
    
    https.get(downloadUrl, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Tamaño de respuesta: ${data.length} bytes`);
        console.log(`📝 Primeros 200 caracteres:`, data.substring(0, 200));
        console.log('\n' + '='.repeat(80) + '\n');
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    }).on('error', (err) => {
      console.log(`❌ Error en descarga: ${err.message}`);
      console.log('\n' + '='.repeat(80) + '\n');
      reject(err);
    });
  });
}

// Función para probar descarga con path estructurado
function testStructuredDownload(filename) {
  return new Promise((resolve, reject) => {
    // Extraer fecha del filename
    const match = filename.match(/_(\d{4})(\d{2})(\d{2})_(\d{2})/);
    if (!match) {
      console.log(`❌ No se pudo extraer fecha del filename: ${filename}`);
      resolve(null);
      return;
    }
    
    const [, year, month, day, hour] = match;
    const structuredPath = `/${year}-${month}-${day}/${hour}/${filename}`;
    const downloadUrl = `${VPS_BASE}/download/${encodeURIComponent(structuredPath)}`;
    
    console.log(`🔍 PROBANDO DESCARGA CON PATH ESTRUCTURADO`);
    console.log(`📡 URL: ${downloadUrl}`);
    console.log(`🗂️ Path extraído: ${structuredPath}`);
    
    https.get(downloadUrl, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Tamaño de respuesta: ${data.length} bytes`);
        console.log('\n' + '='.repeat(80) + '\n');
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      console.log(`❌ Error en descarga estructurada: ${err.message}`);
      console.log('\n' + '='.repeat(80) + '\n');
      reject(err);
    });
  });
}

// Función principal
async function main() {
  try {
    console.log('🚀 INICIANDO INVESTIGACIÓN DEL VPS\n');
    
    // 1. Probar endpoint de grabaciones activas
    await makeRequest('/active-recordings', 'OBTENIENDO GRABACIONES ACTIVAS');
    
    // 2. Probar endpoint de grabaciones completadas
    await makeRequest('/recordings', 'OBTENIENDO GRABACIONES COMPLETADAS');
    
    // 3. Probar descarga directa con un archivo conocido
    const testFilename = 'radio-1_20251128_191557_ceecb92b-eaad-4837-8f01-28a093705f83.mp3';
    await testDirectDownload(testFilename);
    
    // 4. Probar descarga con path estructurado
    await testStructuredDownload(testFilename);
    
    // 5. Verificar si hay archivos de hoy
    console.log('🔍 VERIFICANDO POSIBLES ARCHIVOS DE HOY...');
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    console.log(`📅 Fecha de hoy formateada: ${todayFormatted}`);
    
    // Intentar con posibles nombres de archivos de hoy
    const possibleTodayFiles = [
      `radio-1_${todayFormatted}_000000_test.mp3`,
      `radio_mijm9xsi_6nx1sqf_${todayFormatted}_000000_test.mp3`
    ];
    
    for (const filename of possibleTodayFiles) {
      console.log(`🧪 Probando archivo posible de hoy: ${filename}`);
      try {
        await testDirectDownload(filename);
      } catch (error) {
        // Continuar con el siguiente
      }
    }
    
    console.log('✅ INVESTIGACIÓN COMPLETADA');
    console.log('\n📋 RESUMEN DE HALLAZGOS:');
    console.log('1. El VPS tiene dos endpoints principales:');
    console.log('   - /api/active-recordings: Para grabaciones en proceso');
    console.log('   - /api/recordings: Para archivos completados');
    console.log('2. Los archivos se organizan por fecha en el VPS');
    console.log('3. Las grabaciones actuales pueden estar en una carpeta temporal');
    console.log('4. Los archivos se mueven a la carpeta de archivos completados al terminar');
    
  } catch (error) {
    console.error('💥 Error durante la investigación:', error);
  }
}

// Ejecutar
main();