#!/usr/bin/env node

// Script simple para verificar datos de radio usando fetch
const https = require('https');

// Configuración desde el archivo .env
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

async function checkRadio(radioId) {
  try {
    console.log(`🔍 Verificando radio con ID: ${radioId}`);
    
    const url = `${SUPABASE_URL}/rest/v1/radios?id=eq.${radioId}&select=*`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log('❌ Radio no encontrada');
      return;
    }

    const radio = data[0];
    
    console.log('\n📻 Información de la radio:');
    console.log(`   ID: ${radio.id}`);
    console.log(`   Nombre: ${radio.name}`);
    console.log(`   URL: ${radio.url}`);
    console.log(`   Plataforma (DB): ${radio.platform}`);
    console.log(`   Región: ${radio.region}`);
    console.log(`   Activa: ${radio.is_active}`);
    console.log(`   Fecha de creación: ${radio.created_at}`);
    console.log(`   Última actualización: ${radio.updated_at}`);

    // Verificar si la plataforma coincide con la URL
    const platformFromUrl = detectPlatformFromUrl(radio.url);
    console.log(`\n🔍 Análisis de plataforma:`);
    console.log(`   Plataforma detectada desde URL: ${platformFromUrl}`);
    console.log(`   Plataforma guardada en DB: ${radio.platform}`);
    console.log(`   Coinciden: ${platformFromUrl === radio.platform ? '✅ SÍ' : '❌ NO'}`);

    // Mostrar el mapeo de plataforma
    console.log(`\n📊 Mapeo de plataforma:`);
    console.log(`   Valor frontend: ${platformFromUrl}`);
    console.log(`   Valor DB enum: ${radio.platform}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function detectPlatformFromUrl(url) {
  if (!url) return 'OTHER';
  
  const urlLower = url.toLowerCase();
  
  // Plataformas comunes
  if (urlLower.includes('spotify')) return 'spotify';
  if (urlLower.includes('soundcloud')) return 'soundcloud';
  if (urlLower.includes('mixcloud')) return 'mixcloud';
  if (urlLower.includes('youtube')) return 'youtube';
  if (urlLower.includes('twitch')) return 'twitch';
  if (urlLower.includes('facebook')) return 'facebook';
  
  // Proveedores chilenos
  if (urlLower.includes('arkeo')) return 'arkeo';
  if (urlLower.includes('creattiva')) return 'creattiva';
  if (urlLower.includes('visualradio')) return 'visualradio';
  if (urlLower.includes('mediaweb')) return 'mediaweb';
  if (urlLower.includes('digitalproserver')) return 'digitalproserver';
  if (urlLower.includes('tustreaming')) return 'tustreaming';
  if (urlLower.includes('streaminghd')) return 'streaminghd';
  if (urlLower.includes('neonetwork')) return 'neonetwork';
  if (urlLower.includes('chiloestreaming')) return 'chiloestreaming';
  
  // Tecnologías base
  if (urlLower.includes('icecast')) return 'icecast';
  if (urlLower.includes('shoutcast')) return 'shoutcast';
  if (urlLower.includes('rtmp')) return 'rtmp';
  
  // Por defecto
  if (urlLower.includes('http')) return 'direct';
  
  return 'OTHER';
}

// Polyfill para fetch si no está disponible
if (!global.fetch) {
  global.fetch = function(url, options) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options?.method || 'GET',
        headers: options?.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        });
      });
      req.on('error', reject);
      if (options?.body) req.write(options.body);
      req.end();
    });
  };
}

// Obtener el ID de la radio desde los argumentos
const radioId = process.argv[2];

if (!radioId) {
  console.log('Uso: node check-radio-db.js <radio-id>');
  console.log('Ejemplo: node check-radio-db.js radio_mijm9xcw_ppk071p');
  process.exit(1);
}

checkRadio(radioId);