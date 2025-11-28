#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Leer credenciales del .env
function getSupabaseCredentials() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('Archivo .env no encontrado');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
  const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan credenciales de Supabase en .env');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Función para crear radio directamente en Supabase
async function createRadioDirect(radioData) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  
  console.log(`\n🌐 Conectando a Supabase: ${supabaseUrl}`);
  console.log(`🔑 Usando ANON KEY: ${supabaseAnonKey.substring(0, 30)}...`);

  // Mapear plataforma a enum de Supabase
  const mapPlatformToEnum = (platform) => {
    const platformMap = {
      'youtube': 'YOUTUBE',
      'twitch': 'TWITCH',
      'facebook': 'FACEBOOK',
      'icecast': 'ICECAST',
      'shoutcast': 'SHOUTCAST',
      'direct': 'HTTP_STREAM',
      'http': 'HTTP_STREAM',
      'rtmp': 'RTMP',
      'centova': 'ICECAST',
      'sonicpanel': 'ICECAST',
      'azuracast': 'ICECAST',
    };
    return platformMap[platform] || 'OTHER';
  };

  // Preparar datos para Supabase
  const dataParaSupabase = {
    name: radioData.name,
    stream_url: radioData.streamUrl,
    platform: mapPlatformToEnum(radioData.streamPlatform),
    region: radioData.region,
    status: radioData.isActive ? 'ACTIVE' : 'INACTIVE',
    description: radioData.genre || 'Música',
    priority: radioData.priority || 1,
    cost_per_hour: radioData.costPerHour || 0.0,
    last_verification_status: 'PENDING',
    last_verified_at: new Date().toISOString(),
    metadata: {
      programadora: radioData.programadora || radioData.name,
      frequency: radioData.frequency || '',
      city: radioData.city || radioData.region,
      website: radioData.website || '',
      streamPlatform: radioData.streamPlatform || 'direct',
      created_via: 'script-direct'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/radios`,
      dataParaSupabase,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    return response.data[0];
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error('Ya existe una radio con ese nombre y región');
    }
    throw new Error(`Error creando radio: ${error.message}`);
  }
}

// Función principal
async function main() {
  console.log('🎙️ CREAR RADIO DIRECTAMENTE EN SUPABASE');
  console.log('=========================================\n');

  try {
    // Verificar credenciales
    const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
    console.log('✅ Credenciales de Supabase verificadas\n');

    // Obtener datos de la radio
    console.log('📻 Ingresa los datos de la nueva radio:\n');

    const name = await question('Nombre de la radio: ');
    const streamUrl = await question('URL del stream: ');
    const streamPlatform = await question('Plataforma (direct/youtube/icecast/etc): ') || 'direct';
    const region = await question('Región: ');
    const city = await question('Ciudad: ') || region;
    const genre = await question('Género: ') || 'Música';
    const programadora = await question('Programadora: ') || name;
    const frequency = await question('Frecuencia (ej: 99.9 FM): ') || '';
    const website = await question('Website: ') || '';

    const radioData = {
      name,
      streamUrl,
      streamPlatform,
      region,
      city,
      genre,
      programadora,
      frequency,
      website,
      isActive: true
    };

    console.log('\n📊 Datos a guardar:');
    console.log(JSON.stringify(radioData, null, 2));

    const confirm = await question('\n¿Crear esta radio? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
      console.log('❌ Operación cancelada');
      rl.close();
      return;
    }

    console.log('\n🚀 Creando radio en Supabase...');
    const newRadio = await createRadioDirect(radioData);

    console.log('\n✅ ¡Radio creada exitosamente!');
    console.log(`📊 ID: ${newRadio.id}`);
    console.log(`📻 Nombre: ${newRadio.name}`);
    console.log(`🌐 Stream: ${newRadio.stream_url}`);
    console.log(`📍 Región: ${newRadio.region}`);
    console.log(`✨ Estado: ${newRadio.status}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
main().then(() => {
  console.log('\n👋 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});