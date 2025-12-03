#!/usr/bin/env node

/**
 * Script para verificar que los nombres reales de radios se muestran en la interfaz
 * Este script simula lo que vería el usuario en la página /grabaciones
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function verificarNombresReales() {
  console.log('🔍 VERIFICANDO NOMBRES REALES EN INTERFAZ DE GRABACIONES\n');

  try {
    // 1. Obtener grabaciones desde el endpoint que usa la interfaz
    console.log('📡 Obteniendo grabaciones desde /api/recordings-from-supabase...');
    
    // Simular la llamada que hace el frontend
    const response = await fetch('http://localhost:3000/api/recordings-from-supabase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Respuesta recibida del endpoint');
    console.log(`📊 Estado: ${data.status}`);
    console.log(`📈 Total de grabaciones: ${data.recordings?.length || 0}\n`);

    if (data.status === 'success' && data.recordings && data.recordings.length > 0) {
      
      console.log('📋 DETALLE DE GRABACIONES (como las vería el usuario):\n');
      
      data.recordings.forEach((recording, index) => {
        console.log(`--- Grabación ${index + 1} ---`);
        console.log(`📁 Filename: ${recording.filename}`);
        console.log(`📻 Radio Name: ${recording.radio_name}`);
        console.log(`🆔 Radio ID: ${recording.radio_id}`);
        console.log(`🌍 Región: ${recording.radio_region}`);
        console.log(`🏙️ Ciudad: ${recording.radio_city}`);
        console.log(`📅 Fecha: ${recording.recorded_at}`);
        console.log(`💾 Tamaño: ${(recording.file_size / 1024 / 1024).toFixed(2)} MB`);
        
        // Verificar si es un nombre genérico o real
        const esNombreGenerico = recording.radio_name?.toLowerCase().includes('radio mijm') || 
                                recording.radio_name?.toLowerCase().includes('radio unknown') ||
                                recording.radio_name?.toLowerCase().includes('radio_');
        
        if (esNombreGenerico) {
          console.log(`�️ NOMBRE GENÉRICO DETECTADO: ${recording.radio_name}`);
        } else {
          console.log(`✅ NOMBRE REAL DETECTADO: ${recording.radio_name}`);
        }
        
        console.log('');
      });

      // Resumen
      const nombresReales = data.recordings.filter(rec => {
        const nombre = rec.radio_name?.toLowerCase() || '';
        return !nombre.includes('radio mijm') && 
               !nombre.includes('radio unknown') && 
               !nombre.includes('radio_') &&
               nombre.length > 0;
      }).length;

      const nombresGenericos = data.recordings.length - nombresReales;

      console.log('📊 RESUMEN DE VERIFICACIÓN:');
      console.log(`✅ Grabaciones con nombres REALES: ${nombresReales}`);
      console.log(`❌ Grabaciones con nombres GENÉRICOS: ${nombresGenericos}`);
      console.log(`📈 Porcentaje de nombres reales: ${((nombresReales / data.recordings.length) * 100).toFixed(1)}%`);

      if (nombresGenericos === 0) {
        console.log('\n🎉 ¡TODAS LAS GRABACIONES TIENEN NOMBRES REALES!');
        console.log('✅ El sistema está funcionando correctamente');
      } else {
        console.log('\n⚠️  Algunas grabaciones aún tienen nombres genéricos');
        console.log('🔧 Se requiere investigación adicional');
      }

    } else {
      console.log('⚠️  No se encontraron grabaciones en la respuesta');
      if (data.message) {
        console.log(`💬 Mensaje: ${data.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error al verificar nombres reales:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose:');
      console.log('   cd app && npm run dev');
    }
  }
}

// Ejecutar verificación
console.log('🚀 Iniciando verificación de nombres reales en grabaciones...\n');

// Esperar un momento para que el servidor esté listo
setTimeout(() => {
  verificarNombresReales().catch(error => {
    console.error('❌ Error crítico:', error);
  });
}, 2000);