#!/usr/bin/env node

/**
 * Script para diagnosticar el formato actual de datos del endpoint VPS
 * y verificar qué información se está devolviendo
 */

const axios = require('axios');

const VPS_URL = 'http://213.199.39.147:5000/api/recordings';

async function diagnoseVPSFormat() {
  console.log('🔍 Diagnosticando formato del endpoint VPS...');
  console.log('📡 URL:', VPS_URL);
  
  try {
    console.log('\n📨 Realizando petición GET...');
    const response = await axios.get(VPS_URL, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Respuesta recibida');
    console.log('📊 Status:', response.status);
    console.log('📦 Content-Type:', response.headers['content-type']);
    
    const data = response.data;
    console.log('\n📋 Estructura de datos recibida:');
    console.log(JSON.stringify(data, null, 2));
    
    // Análisis detallado
    console.log('\n🔬 Análisis detallado:');
    
    if (data.recordings && Array.isArray(data.recordings)) {
      console.log(`📁 Total de grabaciones: ${data.recordings.length}`);
      
      if (data.recordings.length > 0) {
        const firstRecording = data.recordings[0];
        console.log('\n📝 Primer registro de grabación:');
        console.log(JSON.stringify(firstRecording, null, 2));
        
        console.log('\n🔍 Campos disponibles:');
        Object.keys(firstRecording).forEach(key => {
          const value = firstRecording[key];
          console.log(`  - ${key}: ${typeof value} = ${value}`);
        });
        
        // Verificar si hay información de ruta
        if (firstRecording.path) {
          console.log('\n📂 Información de ruta detectada:', firstRecording.path);
        }
        
        if (firstRecording.filename) {
          console.log('\n📄 Nombre de archivo:', firstRecording.filename);
          // Intentar extraer información de la ruta
          const pathParts = firstRecording.filename.split('/');
          if (pathParts.length > 1) {
            console.log('\n📂 Partes de la ruta:');
            pathParts.forEach((part, index) => {
              console.log(`  [${index}] ${part}`);
            });
          }
        }
      }
    } else {
      console.log('❌ No se encontró el array "recordings" en la respuesta');
      console.log('📦 Datos crudos:', data);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con VPS:', error.message);
    
    if (error.response) {
      console.log('📡 Respuesta de error:');
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
    } else if (error.request) {
      console.log('📡 No se recibió respuesta del servidor');
      console.log('  Verifica que el VPS esté ejecutándose en el puerto 5000');
    }
  }
}

// Ejecutar diagnóstico
diagnoseVPSFormat().catch(console.error);