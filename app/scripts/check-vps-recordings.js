#!/usr/bin/env node

// Script para verificar grabaciones en el VPS directamente

const axios = require('axios');

const VPS_API_BASE = 'http://213.199.39.147:5000/api';

async function checkVPSRecordings() {
  console.log('🔍 Verificando grabaciones en el VPS...');
  console.log(`📡 Endpoint: ${VPS_API_BASE}/recordings\n`);

  try {
    // Obtener lista de grabaciones desde el VPS
    const response = await axios.get(`${VPS_API_BASE}/recordings`, {
      timeout: 10000
    });

    console.log('✅ Respuesta del VPS:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.status === 'success' && response.data.recordings) {
      const recordings = response.data.recordings;
      console.log(`\n📊 Total de grabaciones encontradas: ${recordings.length}`);
      
      if (recordings.length > 0) {
        console.log('\n📁 Detalle de grabaciones:');
        recordings.forEach((recording, index) => {
          console.log(`\n${index + 1}. ${recording.filename}`);
          console.log(`   📏 Tamaño: ${recording.size} bytes`);
          console.log(`   📅 Creado: ${recording.created_at || recording.created}`);
          console.log(`   📂 Ruta: ${recording.path || 'N/A'}`);
        });
        
        // Buscar grabaciones recientes (últimas 24 horas)
        console.log('\n🔎 Buscando grabaciones recientes (últimas 24 horas)...');
        const now = new Date();
        const recentRecordings = recordings.filter(rec => {
          const createdDate = new Date(rec.created_at || rec.created);
          const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
          return hoursDiff < 24;
        });
        
        console.log(`📊 Grabaciones en las últimas 24 horas: ${recentRecordings.length}`);
        if (recentRecordings.length > 0) {
          console.log('\n📁 Grabaciones recientes:');
          recentRecordings.forEach((recording, index) => {
            console.log(`\n${index + 1}. ${recording.filename}`);
            console.log(`   📅 Creado: ${recording.created_at || recording.created}`);
          });
        } else {
          console.log('⚠️ No se encontraron grabaciones recientes.');
          console.log('💡 Esto explica por qué la grabación no aparece en /grabaciones');
        }
      } else {
        console.log('⚠️ No se encontraron grabaciones en el VPS.');
      }
    } else {
      console.log('⚠️ El VPS devolvió una respuesta inesperada.');
      console.log('Respuesta:', response.data);
    }

  } catch (error) {
    console.error('❌ Error al conectar con el VPS:');
    if (error.response) {
      console.error('📡 Código de estado:', error.response.status);
      console.error('📄 Datos de error:', error.response.data);
    } else if (error.request) {
      console.error('📡 No se recibió respuesta del VPS');
      console.error('🌐 Verifica que el VPS esté ejecutándose en http://213.199.39.147:5000');
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

// También verificar grabaciones activas
async function checkActiveRecordings() {
  console.log('\n\n🔍 Verificando grabaciones ACTIVAS en el VPS...');
  console.log(`📡 Endpoint: ${VPS_API_BASE}/active-recordings\n`);

  try {
    const response = await axios.get(`${VPS_API_BASE}/active-recordings`, {
      timeout: 10000
    });

    console.log('✅ Respuesta del VPS (grabaciones activas):');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error al verificar grabaciones activas:', error.message);
  }
}

// Ejecutar ambas verificaciones
async function runFullCheck() {
  await checkVPSRecordings();
  await checkActiveRecordings();
  
  console.log('\n\n📋 RESUMEN:');
  console.log('Si la grabación no aparece en /grabaciones pero el proceso de grabación terminó,');
  console.log('es posible que:');
  console.log('1. El archivo no se guardó correctamente en el VPS');
  console.log('2. El VPS no está indexando correctamente los archivos');
  console.log('3. Hay un problema de permisos en el directorio de grabaciones');
  console.log('\nRecomendación: Verificar manualmente en el VPS el directorio:');
  console.log('/home/radioapp/radio-recorder/recordings/');
}

runFullCheck().catch(console.error);