#!/usr/bin/env node

/**
 * Script para verificar qué plataformas REALMENTE están siendo aceptadas por la base de datos
 * Este script verifica el valor real guardado en la base de datos después de cada actualización
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Falta configuración de Supabase');
  process.exit(1);
}

// Definir plataformas del frontend directamente
const STREAMING_PLATFORMS = [
  'youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin',
  'vimeo', 'dailymotion', 'rumble', 'odysee', 'bitchute', 'kick', 'dlive', 'trovo',
  'streamable', 'wistia', 'brightcove', 'jwplayer', 'soundcloud', 'spotify',
  'apple-music', 'amazon-music', 'tidal', 'deezer', 'pandora', 'iheartradio',
  'tunein', 'shoutcast', 'icecast', 'hls', 'dash', 'rtmp', 'rtsp', 'm3u8',
  'mp4', 'mp3', 'aac', 'ogg', 'flac', 'wav', 'm4a', 'direct'
];

async function loginAndGetToken() {
  const loginData = {
    email: 'admin@verificador.com',
    password: 'admin123'
  };

  console.log('🔐 Obteniendo token de autenticación...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      throw new Error(`Error en login: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Token obtenido exitosamente');
    return data.token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    throw error;
  }
}

async function getRadioById(token, radioId) {
  const response = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo radio: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

async function updateRadioPlatform(token, radioId, platform) {
  const updateData = {
    streamPlatform: platform,
    streamUrl: 'https://test.example.com/stream'
  };

  const response = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error actualizando radio: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function verifyPlatforms() {
  console.log('🔍 Verificando REALMENTE qué plataformas acepta la base de datos...\n');

  try {
    const token = await loginAndGetToken();
    
    // Obtener un radio existente
    console.log('📻 Obteniendo radio existente para pruebas...');
    const listResponse = await fetch('http://localhost:3000/api/radios?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error('Error obteniendo lista de radios');
    }

    const listData = await listResponse.json();
    if (!listData.data || listData.data.length === 0) {
      throw new Error('No hay radios disponibles para probar');
    }

    const testRadio = listData.data[0];
    const radioId = testRadio.id;
    const originalPlatform = testRadio.streamPlatform;
    
    console.log(`✅ Radio obtenida con ID: ${radioId}`);
    console.log(`   Nombre: ${testRadio.name}`);
    console.log(`   Plataforma original: ${originalPlatform}`);
    console.log(`   URL: ${testRadio.streamUrl}\n`);

    const results = {
      timestamp: new Date().toISOString(),
      totalPlatforms: STREAMING_PLATFORMS.length,
      workingPlatforms: [],
      fallbackPlatforms: [], // Plataformas que fueron convertidas a OTHER
      failingPlatforms: [],
      details: {}
    };

    console.log(`🚀 Probando ${STREAMING_PLATFORMS.length} plataformas...\n`);

    // Probar cada plataforma
    for (const platform of STREAMING_PLATFORMS) {
      console.log(`🧪 Probando plataforma: ${platform}...`);
      
      try {
        // Actualizar con la plataforma
        await updateRadioPlatform(token, radioId, platform);
        
        // Verificar qué valor realmente se guardó
        const updatedRadio = await getRadioById(token, radioId);
        const savedPlatform = updatedRadio.streamPlatform;
        
        if (savedPlatform === platform) {
          console.log(`  ✅ ${platform}: Guardado correctamente`);
          results.workingPlatforms.push(platform);
          results.details[platform] = { status: 'working', savedAs: savedPlatform };
        } else if (savedPlatform === 'OTHER') {
          console.log(`  ⚠️  ${platform}: Convertida a OTHER (no permitida en DB)`);
          results.fallbackPlatforms.push(platform);
          results.details[platform] = { status: 'fallback', savedAs: savedPlatform };
        } else {
          console.log(`  ❓ ${platform}: Guardada como ${savedPlatform}`);
          results.details[platform] = { status: 'converted', savedAs: savedPlatform };
        }
        
      } catch (error) {
        console.log(`  ❌ ${platform}: Error - ${error.message}`);
        results.failingPlatforms.push(platform);
        results.details[platform] = { status: 'error', error: error.message };
      }
    }

    // Restaurar plataforma original
    console.log(`\n🔄 Restaurando plataforma original: ${originalPlatform}...`);
    try {
      await updateRadioPlatform(token, radioId, originalPlatform);
      const finalRadio = await getRadioById(token, radioId);
      if (finalRadio.streamPlatform === originalPlatform) {
        console.log(`  ✅ Plataforma original restaurada exitosamente`);
      } else {
        console.log(`  ⚠️  Plataforma original restaurada como: ${finalRadio.streamPlatform}`);
      }
    } catch (error) {
      console.log(`  ❌ Error restaurando plataforma original: ${error.message}`);
    }

    // Generar resumen
    console.log('\n📊 RESULTADOS FINALES:');
    console.log('======================');
    console.log(`\n✅ Plataformas que FUNCIONAN (${results.workingPlatforms.length}):`);
    results.workingPlatforms.forEach(p => console.log(`  - ${p}`));
    
    console.log(`\n⚠️  Plataformas convertidas a OTHER (${results.fallbackPlatforms.length}):`);
    results.fallbackPlatforms.forEach(p => console.log(`  - ${p}`));
    
    console.log(`\n❌ Plataformas con ERROR (${results.failingPlatforms.length}):`);
    results.failingPlatforms.forEach(p => console.log(`  - ${p}`));

    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`- Total de plataformas: ${results.totalPlatforms}`);
    console.log(`- Funcionan correctamente: ${results.workingPlatforms.length}`);
    console.log(`- Convertidas a OTHER: ${results.fallbackPlatforms.length}`);
    console.log(`- Con errores: ${results.failingPlatforms.length}`);
    console.log(`- Porcentaje de éxito real: ${((results.workingPlatforms.length / results.totalPlatforms) * 100).toFixed(1)}%`);

    // Guardar resultados
    const resultsPath = path.join(__dirname, 'real-platform-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados detallados guardados en: ${resultsPath}`);

  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyPlatforms();
}

module.exports = { verifyPlatforms };