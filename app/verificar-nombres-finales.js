#!/usr/bin/env node

/**
 * Script final para verificar que los nombres reales se muestran en la interfaz
 * Este script verifica que el enriquecimiento de datos está funcionando
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function verificarNombresFinales() {
  console.log('🔍 VERIFICACIÓN FINAL DE NOMBRES REALES EN GRABACIONES\n');

  try {
    // 1. Obtener grabaciones directamente desde Supabase para verificar el enriquecimiento
    console.log('📡 Obteniendo grabaciones desde Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/recordings?select=*&order=recorded_at.desc&limit=10`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const recordings = await response.json();
    
    console.log(`✅ ${recordings.length} grabaciones obtenidas de Supabase\n`);

    if (recordings.length === 0) {
      console.log('⚠️ No hay grabaciones en la base de datos');
      return;
    }

    console.log('📋 ANÁLISIS DE NOMBRES EN GRABACIONES:\n');
    
    let nombresReales = 0;
    let nombresGenericos = 0;

    recordings.forEach((recording, index) => {
      console.log(`--- Grabación ${index + 1} ---`);
      console.log(`📁 Filename: ${recording.filename}`);
      console.log(`📻 Radio ID: ${recording.radio_id}`);
      console.log(`📛 Radio Name: ${recording.radio_name}`);
      console.log(`🌍 Región: ${recording.radio_region}`);
      console.log(`🏙️ Ciudad: ${recording.radio_city}`);
      
      // Verificar si es nombre real o genérico
      const nombre = recording.radio_name?.toLowerCase() || '';
      const esGenerico = nombre.includes('radio mijm') || 
                        nombre.includes('radio unknown') || 
                        nombre.includes('radio_') ||
                        nombre === `radio ${recording.radio_id}`.toLowerCase();
      
      if (esGenerico) {
        console.log(`❌ NOMBRE GENÉRICO DETECTADO`);
        nombresGenericos++;
      } else {
        console.log(`✅ NOMBRE REAL DETECTADO`);
        nombresReales++;
      }
      
      console.log('');
    });

    // Resumen final
    console.log('📊 RESUMEN FINAL DE ENRIQUECIMIENTO:');
    console.log(`✅ Grabaciones con NOMBRES REALES: ${nombresReales}`);
    console.log(`❌ Grabaciones con NOMBRES GENÉRICOS: ${nombresGenericos}`);
    console.log(`📈 Porcentaje de nombres reales: ${((nombresReales / recordings.length) * 100).toFixed(1)}%`);

    if (nombresGenericos === 0) {
      console.log('\n🎉 ¡TODAS LAS GRABACIONES TIENEN NOMBRES REALES!');
      console.log('✅ El sistema de enriquecimiento está funcionando perfectamente');
    } else {
      console.log('\n⚠️ Algunas grabaciones aún tienen nombres genéricos');
      console.log('🔍 Las grabaciones con nombres genéricos pueden ser de radios que no existen en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error al verificar nombres finales:', error.message);
  }
}

// Ejecutar verificación
console.log('🚀 Iniciando verificación final de nombres reales...\n');
verificarNombresFinales().catch(error => {
  console.error('❌ Error crítico:', error);
});