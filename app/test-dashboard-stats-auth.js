#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

async function testDashboardStatsWithAuth() {
  try {
    console.log('🔍 Probando endpoint /api/dashboard/stats-direct con autenticación...');
    
    // Leer el token de admin
    let adminToken;
    try {
      adminToken = fs.readFileSync('admin-token.txt', 'utf8').trim();
      console.log('✅ Token de admin leído correctamente');
    } catch (error) {
      console.log('❌ Error leyendo admin-token.txt:', error.message);
      return;
    }
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/dashboard/stats-direct',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('📡 Enviando petición con token de autenticación...');
    
    const req = http.request(options, (res) => {
      console.log('📊 Status:', res.statusCode);
      console.log('📋 Headers:', res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📄 Respuesta completa:');
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
          
          // Analizar los datos
          if (jsonData.stats) {
            console.log('\n📊 ANÁLISIS DE ESTADÍSTICAS:');
            console.log(`🟢 Online: ${jsonData.stats.totalOnline || 0}`);
            console.log(`🔴 Offline: ${jsonData.stats.totalOffline || 0}`);
            console.log(`🟡 Activo sin verificar: ${jsonData.stats.totalActiveUnverified || 0}`);
            console.log(`⚫ Inactivo: ${jsonData.stats.totalInactive || 0}`);
            console.log(`📻 Total de radios: ${jsonData.stats.totalRadios || 0}`);
          }
        } catch (parseError) {
          console.log('❌ Error parseando JSON:', parseError.message);
          console.log('📄 Contenido raw:', data);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en la petición:', err.message);
    });
    
    req.setTimeout(30000, () => {
      console.log('⏱️ Timeout alcanzado');
      req.destroy();
    });
    
    req.end();
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar la prueba
testDashboardStatsWithAuth();