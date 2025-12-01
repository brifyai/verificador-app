#!/usr/bin/env node

// Script para verificar la plataforma de una radio específica en la base de datos
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRadioPlatform(radioId) {
  try {
    console.log(`🔍 Verificando radio con ID: ${radioId}`);
    
    // Obtener información de la radio
    const { data: radio, error } = await supabase
      .from('radios')
      .select('*')
      .eq('id', radioId)
      .single();

    if (error) {
      console.error('❌ Error al obtener la radio:', error.message);
      return;
    }

    if (!radio) {
      console.log('❌ Radio no encontrada');
      return;
    }

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

// Obtener el ID de la radio desde los argumentos
const radioId = process.argv[2];

if (!radioId) {
  console.log('Uso: node check-radio-platform.js <radio-id>');
  console.log('Ejemplo: node check-radio-platform.js radio_mijm9xcw_ppk071p');
  process.exit(1);
}

checkRadioPlatform(radioId);