#!/usr/bin/env node

/**
 * Script para verificar el estado actual del sistema de verificación
 * Este script muestra estadísticas detalladas sobre el estado de las radios
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSystemStatus() {
  console.log('🔍 Verificando estado del sistema de radios...\n');

  try {
    // Obtener todas las radios
    const { data: radios, error } = await supabase
      .from('radios')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error al obtener radios:', error);
      return;
    }

    console.log(`📊 Total de radios en el sistema: ${radios.length}`);

    // Estadísticas básicas
    const totalActive = radios.filter(r => r.isActive).length;
    const totalInactive = radios.filter(r => !r.isActive).length;
    
    console.log(`✅ Radios activas: ${totalActive}`);
    console.log(`⏸️  Radios inactivas: ${totalInactive}`);

    // Estadísticas de verificación
    const verifiedRadios = radios.filter(r => r.lastVerificationStatus);
    const onlineRadios = radios.filter(r => r.lastVerificationStatus === 'ONLINE');
    const offlineRadios = radios.filter(r => r.lastVerificationStatus === 'OFFLINE');
    const neverVerified = radios.filter(r => !r.lastVerificationStatus);

    console.log(`\n🔍 Estado de verificación:`);
    console.log(`✅ Radios verificadas (con estado): ${verifiedRadios.length}`);
    console.log(`🟢 Radios online: ${onlineRadios.length}`);
    console.log(`🔴 Radios offline: ${offlineRadios.length}`);
    console.log(`⚪ Radios sin verificar: ${neverVerified.length}`);

    // Mostrar últimas verificaciones
    if (verifiedRadios.length > 0) {
      console.log(`\n📅 Últimas verificaciones:`);
      
      // Ordenar por fecha de verificación (más reciente primero)
      const sortedByVerification = verifiedRadios
        .filter(r => r.lastVerifiedAt)
        .sort((a, b) => new Date(b.lastVerifiedAt).getTime() - new Date(a.lastVerifiedAt).getTime());

      if (sortedByVerification.length > 0) {
        console.log(`🕐 Última verificación: ${sortedByVerification[0].name} - ${sortedByVerification[0].lastVerificationStatus} (${new Date(sortedByVerification[0].lastVerifiedAt).toLocaleString()})`);
        
        // Mostrar algunas radios recientemente verificadas
        console.log(`\n📋 Top 5 radios recientemente verificadas:`);
        sortedByVerification.slice(0, 5).forEach((radio, index) => {
          const status = radio.lastVerificationStatus === 'ONLINE' ? '🟢' : '🔴';
          const time = new Date(radio.lastVerifiedAt).toLocaleString();
          console.log(`  ${index + 1}. ${status} ${radio.name} - ${time}`);
        });
      }
    }

    // Problemas potenciales
    console.log(`\n⚠️  Problemas detectados:`);
    
    const problems = [];
    
    if (neverVerified.length > 0) {
      problems.push(`${neverVerified.length} radios nunca han sido verificadas`);
    }
    
    if (offlineRadios.length > onlineRadios.length) {
      problems.push(`Más radios offline (${offlineRadios}) que online (${onlineRadios})`);
    }
    
    const oldVerifications = verifiedRadios.filter(r => {
      if (!r.lastVerifiedAt) return false;
      const hoursSince = (Date.now() - new Date(r.lastVerifiedAt).getTime()) / (1000 * 60 * 60);
      return hoursSince > 24;
    });
    
    if (oldVerifications.length > 0) {
      problems.push(`${oldVerifications.length} radios con verificaciones antiguas (>24 horas)`);
    }

    if (problems.length === 0) {
      console.log('✅ No se detectaron problemas importantes');
    } else {
      problems.forEach(problem => console.log(`  • ${problem}`));
    }

    // Recomendaciones
    console.log(`\n💡 Recomendaciones:`);
    if (neverVerified.length > 0) {
      console.log(`  • Ejecutar verificación masiva para ${neverVerified.length} radios pendientes`);
    }
    if (oldVerifications.length > 0) {
      console.log(`  • Actualizar verificaciones antiguas`);
    }
    if (offlineRadios.length > 0) {
      console.log(`  • Revisar radios offline para verificar si los streams están activos`);
    }

    console.log(`\n🎯 Resumen:`);
    console.log(`  • Sistema funcionando con ${radios.length} radios`);
    console.log(`  • ${onlineRadios.length} online, ${offlineRadios.length} offline`);
    console.log(`  • ${verifiedRadios.length} verificadas, ${neverVerified.length} pendientes`);

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSystemStatus().then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { checkSystemStatus };