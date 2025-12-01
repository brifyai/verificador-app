#!/usr/bin/env node

// Script para probar TODAS las plataformas del frontend con la base de datos
// Este script verificará qué plataformas de las 20+ disponibles en el frontend
// son realmente aceptadas por el constraint de la base de datos

const API_BASE = 'http://localhost:3000/api';

// Credenciales de prueba
const TEST_CREDENTIALS = {
  email: 'admin@verificador.com',
  password: 'admin123'
};

// Todas las plataformas del frontend (extraídas de app/lib/streaming-platforms.ts)
const ALL_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive',
  'trovo', 'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud',
  'spotify', 'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora',
  'iheartradio', 'tunein', 'shoutcast', 'icecast', 'hls', 'dash', 'rtmp',
  'rtsp', 'm3u8', 'mp4', 'mp3', 'aac', 'ogg', 'flac', 'wav', 'm4a'
];

async function getAuthToken() {
  console.log('🔐 Obteniendo token de autenticación...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Token obtenido exitosamente');
    return data.token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error.message);
    throw error;
  }
}

async function getExistingRadio(token) {
  console.log('📻 Obteniendo radio existente para pruebas...');
  
  try {
    const response = await fetch(`${API_BASE}/radios?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    console.log('📡 Respuesta cruda:', JSON.stringify(responseData, null, 2));
    
    // La respuesta puede tener diferentes estructuras
    let radios = responseData;
    if (responseData.data && Array.isArray(responseData.data)) {
      radios = responseData.data;
    } else if (responseData.radios && Array.isArray(responseData.radios)) {
      radios = responseData.radios;
    } else if (!Array.isArray(responseData)) {
      // Si es un objeto único, convertirlo en array
      radios = [responseData];
    }
    
    if (!radios || radios.length === 0) {
      throw new Error('No hay radios disponibles para pruebas');
    }

    const radio = radios[0];
    console.log('✅ Radio obtenida con ID:', radio.id);
    console.log('   Nombre:', radio.name);
    console.log('   Plataforma actual:', radio.streamPlatform);
    console.log('   URL:', radio.streamUrl);
    return radio;
  } catch (error) {
    console.error('❌ Error al obtener radio existente:', error.message);
    throw error;
  }
}

async function testPlatform(token, radio, platform) {
  try {
    console.log(`🧪 Probando plataforma: ${platform}...`);
    
    const response = await fetch(`${API_BASE}/radios/${radio.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name: radio.name,
        streamUrl: radio.streamUrl,
        city: radio.city,
        region: radio.region,
        streamPlatform: platform,
        isActive: radio.isActive,
        genre: radio.genre
      })
    });

    if (response.ok) {
      console.log(`  ✅ ${platform}: Actualización exitosa`);
      return { success: true, platform };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ ${platform}: ${response.status} - ${errorText}`);
      return { success: false, platform, error: `${response.status} - ${errorText}` };
    }
    
  } catch (error) {
    console.log(`  ❌ ${platform}: Error inesperado - ${error.message}`);
    return { success: false, platform, error: error.message };
  }
}

async function testAllPlatforms() {
  console.log('🔍 Verificando TODAS las plataformas del frontend...\n');
  
  let token;
  let originalRadio;
  let workingPlatforms = [];
  let failingPlatforms = [];
  
  try {
    // Obtener token de autenticación
    token = await getAuthToken();
    
    // Obtener radio existente para pruebas
    originalRadio = await getExistingRadio(token);
    
    console.log(`\n🚀 Probando ${ALL_PLATFORMS.length} plataformas...\n`);
    
    // Probar cada plataforma
    for (const platform of ALL_PLATFORMS) {
      const result = await testPlatform(token, originalRadio, platform);
      
      if (result.success) {
        workingPlatforms.push(platform);
      } else {
        failingPlatforms.push({ platform, error: result.error });
      }
      
      // Pequeña pausa entre pruebas para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Restaurar plataforma original
    console.log(`\n🔄 Restaurando plataforma original: ${originalRadio.streamPlatform}...`);
    const restoreResult = await testPlatform(token, originalRadio, originalRadio.streamPlatform);
    
    if (restoreResult.success) {
      console.log(`  ✅ Plataforma original restaurada exitosamente`);
    } else {
      console.log(`  ❌ Error al restaurar plataforma original: ${restoreResult.error}`);
    }
    
    // Mostrar resultados finales
    console.log('\n📊 RESULTADOS FINALES:');
    console.log('======================');
    console.log(`\n✅ Plataformas que FUNCIONAN (${workingPlatforms.length}):`);
    workingPlatforms.forEach(platform => console.log(`  - ${platform}`));
    
    console.log(`\n❌ Plataformas que FALLAN (${failingPlatforms.length}):`);
    failingPlatforms.forEach(({ platform, error }) => console.log(`  - ${platform}: ${error}`));
    
    console.log('\n📝 RESUMEN:');
    console.log(`- Total de plataformas probadas: ${ALL_PLATFORMS.length}`);
    console.log(`- Plataformas que funcionan: ${workingPlatforms.length}`);
    console.log(`- Plataformas que fallan: ${failingPlatforms.length}`);
    console.log(`- Porcentaje de éxito: ${((workingPlatforms.length / ALL_PLATFORMS.length) * 100).toFixed(1)}%`);
    
    // Guardar resultados en archivo
    const results = {
      timestamp: new Date().toISOString(),
      totalPlatforms: ALL_PLATFORMS.length,
      workingPlatforms,
      failingPlatforms,
      successRate: ((workingPlatforms.length / ALL_PLATFORMS.length) * 100).toFixed(1) + '%'
    };
    
    const fs = require('fs');
    const path = require('path');
    const resultsFile = path.join(__dirname, 'platform-test-results.json');
    
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados guardados en: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testAllPlatforms().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { testAllPlatforms };