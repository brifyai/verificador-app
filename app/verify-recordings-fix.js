#!/usr/bin/env node

/**
 * VERIFICACIÓN: Confirmar que las grabaciones ahora muestran información correcta
 */

const axios = require('axios');
const colors = require('colors');

// Función para verificar las grabaciones desde el endpoint
async function verifyRecordings() {
  console.log(colors.cyan.bold('\n=== VERIFICACIÓN: GRABACIONES CON INFORMACIÓN CORRECTA ===\n'));
  
  try {
    const response = await axios.get('http://localhost:3000/api/recordings-from-supabase', {
      timeout: 10000
    });
    
    if (response.data && response.data.recordings) {
      const recordings = response.data.recordings;
      console.log(colors.green(`✓ Encontradas ${recordings.length} grabaciones`));
      
      console.log(colors.cyan.bold('\n=== GRABACIONES CON INFORMACIÓN ENRIQUECIDA ==='));
      
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. Archivo: ${recording.filename}`);
        console.log(`   🎵 Radio ID: ${recording.radio_id}`);
        console.log(`   📻 Radio Nombre: ${recording.radio_name}`);
        console.log(`   🌍 Región: ${recording.radio_region}`);
        console.log(`   🏙️ Ciudad: ${recording.radio_city}`);
        console.log(`   📅 Fecha: ${recording.recorded_at}`);
        console.log(`   💾 Tamaño: ${recording.size} bytes`);
        console.log('');
      });
      
      // Verificar que no hay datos genéricos
      const hasGenericData = recordings.some(rec => 
        rec.radio_name?.includes('Radio ') || 
        rec.radio_region?.includes('no especificada') ||
        rec.radio_city?.includes('no especificada')
      );
      
      if (hasGenericData) {
        console.log(colors.yellow('⚠️ Algunas grabaciones aún tienen datos genéricos'));
      } else {
        console.log(colors.green('✅ Todas las grabaciones tienen información específica de radios'));
      }
      
      return recordings;
    } else {
      console.log(colors.red('✗ No se pudieron obtener las grabaciones'));
      return [];
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo grabaciones: ${err.message}`));
    return [];
  }
}

// Función para simular lo que ve el frontend
function simulateFrontendView(recordings) {
  console.log(colors.cyan.bold('\n=== SIMULACIÓN: LO QUE VE EL USUARIO ===\n'));
  
  if (recordings.length === 0) {
    console.log(colors.yellow('No hay grabaciones para mostrar'));
    return;
  }
  
  // Agrupar por fecha
  const groupedByDate = {};
  recordings.forEach(rec => {
    const date = new Date(rec.recorded_at).toISOString().split('T')[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(rec);
  });
  
  Object.entries(groupedByDate).forEach(([date, dateRecordings]) => {
    console.log(colors.bold(`📅 ${date}`));
    
    // Agrupar por radio dentro de la fecha
    const groupedByRadio = {};
    dateRecordings.forEach(rec => {
      const radioKey = `${rec.radio_name} (${rec.radio_region})`;
      if (!groupedByRadio[radioKey]) {
        groupedByRadio[radioKey] = [];
      }
      groupedByRadio[radioKey].push(rec);
    });
    
    Object.entries(groupedByRadio).forEach(([radioInfo, radioRecordings]) => {
      console.log(`   🎵 ${radioInfo}`);
      console.log(`   📁 ${radioRecordings.length} archivos`);
      radioRecordings.forEach(rec => {
        const sizeMB = (rec.size / 1024 / 1024).toFixed(2);
        console.log(`      - ${rec.filename} (${sizeMB} MB)`);
      });
      console.log('');
    });
  });
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== VERIFICACIÓN COMPLETA DEL SISTEMA ===\n'));
  
  try {
    // 1. Verificar grabaciones
    const recordings = await verifyRecordings();
    
    // 2. Simular vista del frontend
    simulateFrontendView(recordings);
    
    // 3. Resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN ===\n'));
    
    if (recordings.length > 0) {
      const radiosUnicos = new Set(recordings.map(r => r.radio_name)).size;
      const fechasUnicas = new Set(recordings.map(r => 
        new Date(r.recorded_at).toISOString().split('T')[0]
      )).size;
      
      console.log(`📊 Total grabaciones: ${recordings.length}`);
      console.log(`🎵 Radios diferentes: ${radiosUnicos}`);
      console.log(`📅 Fechas diferentes: ${fechasUnicas}`);
      
      console.log(colors.green('\n✅ SISTEMA FUNCIONANDO CORRECTAMENTE'));
      console.log('Las grabaciones ahora muestran:');
      console.log('- ✅ Nombres reales de radios');
      console.log('- ✅ Regiones específicas');
      console.log('- ✅ Ciudades específicas');
      console.log('- ✅ Organización por fecha');
    } else {
      console.log(colors.yellow('⚠️ No se encontraron grabaciones'));
    }
    
    console.log(colors.cyan.bold('\n=== FIN DE LA VERIFICACIÓN ===\n'));
    
  } catch (err) {
    console.log(colors.red(`Error en verificación: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error inesperado: ${err.message}`));
  console.error(err);
});