#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Mismatch entre grabaciones y radios
 * Analiza por qué las grabaciones no se enlazan correctamente con las radios
 */

const axios = require('axios');
const colors = require('colors');

// Función para obtener grabaciones usando endpoint público
async function getPublicRecordings() {
  console.log(colors.cyan.bold('\n=== GRABACIONES DESDE ENDPOINT PÚBLICO ===\n'));
  
  try {
    const response = await axios.get('http://localhost:3000/api/recording-vps-fixed', {
      timeout: 10000
    });
    
    if (response.data && response.data.status === 'success') {
      const activeRecordings = response.data.active_recordings || {};
      const recordings = Object.values(activeRecordings).map(recording => ({
        filename: recording.filename || `recording_${recording.radio_id}_${Date.now()}.mp3`,
        radio_id: recording.radio_id,
        size: recording.file_size || 0,
        created: recording.start_time || new Date().toISOString()
      }));
      
      console.log(colors.green(`✓ Encontradas ${recordings.length} grabaciones activas`));
      
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. Archivo: ${recording.filename}`);
        console.log(`   Radio ID: ${recording.radio_id}`);
        console.log(`   Tamaño: ${recording.size} bytes`);
        console.log(`   Creado: ${recording.created}`);
        console.log('');
      });
      
      return recordings;
    } else {
      console.log(colors.red('✗ No se encontraron grabaciones en endpoint público'));
      return [];
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo grabaciones: ${err.message}`));
    return [];
  }
}

// Función para obtener grabaciones completas desde el endpoint que usa el frontend
async function getCompleteRecordings() {
  console.log(colors.cyan.bold('\n=== GRABACIONES COMPLETAS (COMO FRONTEND) ===\n'));
  
  try {
    // Usar el mismo endpoint que usa el frontend
    const response = await axios.get('http://localhost:3000/api/recordings-from-supabase', {
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const recordings = response.data.data;
      console.log(colors.green(`✓ Encontradas ${recordings.length} grabaciones completas`));
      
      const radioIds = new Set();
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. Archivo: ${recording.filename}`);
        console.log(`   Radio ID: ${recording.radio_id}`);
        console.log(`   Radio Nombre: ${recording.radio_name || 'NO ENCONTRADO'}`);
        console.log(`   Región: ${recording.radio_region || 'NO ESPECIFICADA'}`);
        console.log(`   Ciudad: ${recording.radio_city || 'NO ESPECIFICADA'}`);
        console.log('');
        
        if (recording.radio_id) {
          radioIds.add(recording.radio_id);
        }
      });
      
      console.log(colors.yellow(`IDs de radio únicos en grabaciones: ${Array.from(radioIds).join(', ')}`));
      return { recordings, radioIds };
    } else {
      console.log(colors.red('✗ No se pudieron obtener las grabaciones completas'));
      return { recordings: [], radioIds: new Set() };
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo grabaciones completas: ${err.message}`));
    return { recordings: [], radioIds: new Set() };
  }
}

// Función para simular datos de radios (basado en lo que sabemos)
function getKnownRadios() {
  console.log(colors.cyan.bold('\n=== RADIOS CONOCIDAS EN EL SISTEMA ===\n'));
  
  // Estas son las radios que sabemos que están en el sistema
  const knownRadios = [
    {
      id_radio: 'mijm9xci',
      name: 'Radio Contagio',
      region: 'Metropolitana',
      city: 'Santiago',
      platform: 'somos'
    },
    {
      id_radio: 'mijm9xsi', 
      name: 'Radio Pilmaiquen',
      region: 'Los Lagos',
      city: 'Puerto Montt',
      platform: 'somos'
    }
  ];
  
  console.log(colors.green(`✓ Conocemos ${knownRadios.length} radios en el sistema:`));
  knownRadios.forEach((radio, index) => {
    console.log(`${index + 1}. ID: ${radio.id_radio}`);
    console.log(`   Nombre: ${radio.name}`);
    console.log(`   Región: ${radio.region}`);
    console.log(`   Ciudad: ${radio.city}`);
    console.log(`   Plataforma: ${radio.platform}`);
    console.log('');
  });
  
  return knownRadios;
}

// Función para analizar el problema
function analyzeProblem(recordings, knownRadios) {
  console.log(colors.cyan.bold('\n=== ANÁLISIS DEL PROBLEMA ===\n'));
  
  const recordingRadioIds = new Set(recordings.map(r => r.radio_id).filter(Boolean));
  const knownRadioIds = new Set(knownRadios.map(r => r.id_radio));
  
  console.log(colors.yellow('IDs de radio en grabaciones:'));
  console.log(Array.from(recordingRadioIds).join(', '));
  console.log('');
  
  console.log(colors.yellow('IDs de radio conocidos:'));
  console.log(Array.from(knownRadioIds).join(', '));
  console.log('');
  
  // Verificar coincidencias
  const matches = [];
  const noMatches = [];
  
  recordingRadioIds.forEach(radioId => {
    const knownRadio = knownRadios.find(r => r.id_radio === radioId);
    if (knownRadio) {
      matches.push({ recordingId: radioId, knownRadio });
      console.log(colors.green(`✓ COINCIDENCIA: ${radioId} = ${knownRadio.name}`));
    } else {
      noMatches.push(radioId);
      console.log(colors.red(`✗ NO ENCONTRADO: ${radioId}`));
    }
  });
  
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO ==='));
  console.log(colors.green(`✓ Coincidencias: ${matches.length}`));
  console.log(colors.red(`✗ Sin coincidencias: ${noMatches.length}`));
  
  if (noMatches.length === 0 && matches.length > 0) {
    console.log(colors.green('\n🎉 ¡TODAS LAS RADIOS ESTÁN EN LA BASE DE DATOS!'));
    console.log('El problema debe estar en otra parte del código.');
    console.log('Posibles causas:');
    console.log('- La API no está buscando correctamente en la base de datos');
    console.log('- Hay un error en el enlace entre las tablas');
    console.log('- Los datos no se están guardando correctamente');
  } else {
    console.log(colors.yellow('\n⚠️ RADIOS FALTANTES EN BASE DE DATOS'));
    console.log('Necesitas agregar estas radios a la tabla radios:');
    noMatches.forEach(radioId => {
      console.log(`INSERT INTO radios (id_radio, name, region, city, platform) VALUES ('${radioId}', 'Radio ${radioId}', 'Región', 'Ciudad', 'somos');`);
    });
  }
  
  return { matches, noMatches };
}

// Función para generar solución
function generateSolution(recordings, knownRadios, matches, noMatches) {
  console.log(colors.cyan.bold('\n=== SOLUCIÓN RECOMENDADA ===\n'));
  
  if (noMatches.length > 0) {
    console.log(colors.yellow('1. AGREGAR RADIOS FALTANTES:'));
    noMatches.forEach(radioId => {
      const radio = knownRadios.find(r => r.id_radio === radioId);
      if (radio) {
        console.log(`INSERT INTO radios (id_radio, name, region, city, platform, vps_id) VALUES ('${radio.id_radio}', '${radio.name}', '${radio.region}', '${radio.city}', '${radio.platform}', '${radio.id_radio}');`);
      }
    });
    console.log('');
  }
  
  console.log(colors.yellow('2. VERIFICAR ENLACE EN API:'));
  console.log('El problema puede estar en el archivo: app/app/api/recordings-from-supabase/route.ts');
  console.log('Asegúrate de que esté buscando correctamente por id_radio y vps_id');
  console.log('');
  
  console.log(colors.yellow('3. PROBAR DESPUÉS DE LA CORRECCIÓN:'));
  console.log('Ejecuta nuevamente este diagnóstico para verificar que todo esté funcionando');
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO: GRABACIONES VS RADIOS ===\n'));
  
  try {
    // 1. Obtener grabaciones públicas
    const publicRecordings = await getPublicRecordings();
    
    // 2. Obtener grabaciones completas (como las ve el frontend)
    const { recordings, radioIds } = await getCompleteRecordings();
    
    // 3. Obtener radios conocidas
    const knownRadios = getKnownRadios();
    
    // 4. Analizar el problema
    const { matches, noMatches } = analyzeProblem(recordings, knownRadios);
    
    // 5. Generar solución
    generateSolution(recordings, knownRadios, matches, noMatches);
    
    console.log(colors.cyan.bold('\n=== FIN DEL DIAGNÓSTICO ===\n'));
    
  } catch (err) {
    console.log(colors.red(`Error en diagnóstico: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error inesperado: ${err.message}`));
  console.error(err);
});