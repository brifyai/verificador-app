#!/usr/bin/env node

/**
 * DEBUG: Verificar radios en base de datos
 * Para entender por qué no se encuentran las radios de las grabaciones
 */

const axios = require('axios');
const colors = require('colors');

// Función para obtener radios desde la base de datos
async function getRadiosFromDatabase() {
  console.log(colors.cyan.bold('\n=== VERIFICANDO RADIOS EN BASE DE DATOS ===\n'));
  
  try {
    // Obtener todas las radios de la base de datos
    const response = await axios.get('http://localhost:3000/api/radios-direct', {
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const radios = response.data.data;
      console.log(colors.green(`✓ Encontradas ${radios.length} radios en la base de datos`));
      
      console.log(colors.cyan.bold('\n=== RADIOS EN BASE DE DATOS ==='));
      radios.forEach((radio, index) => {
        console.log(`${index + 1}. ID: ${radio.id_radio}`);
        console.log(`   Nombre: ${radio.name}`);
        console.log(`   Región: ${radio.region || 'No especificada'}`);
        console.log(`   Ciudad: ${radio.city || 'No especificada'}`);
        console.log(`   VPS ID: ${radio.vps_id || 'No definido'}`);
        console.log('');
      });
      
      return radios;
    } else {
      console.log(colors.red('✗ No se pudieron obtener las radios de la base de datos'));
      return [];
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo radios: ${err.message}`));
    return [];
  }
}

// Función para verificar grabaciones desde VPS
async function getRecordingsFromVPS() {
  console.log(colors.cyan.bold('\n=== GRABACIONES DESDE VPS ===\n'));
  
  try {
    const response = await axios.get('http://localhost:3000/api/recordings-from-supabase', {
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const recordings = response.data.data;
      console.log(colors.green(`✓ Encontradas ${recordings.length} grabaciones`));
      
      const radioIds = new Set();
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. Archivo: ${recording.filename}`);
        console.log(`   Radio ID: ${recording.radio_id}`);
        console.log(`   Radio Nombre: ${recording.radio_name || 'No encontrado'}`);
        console.log(`   Región: ${recording.radio_region || 'No especificada'}`);
        console.log('');
        
        if (recording.radio_id) {
          radioIds.add(recording.radio_id);
        }
      });
      
      console.log(colors.yellow(`IDs de radio únicos en grabaciones: ${Array.from(radioIds).join(', ')}`));
      return { recordings, radioIds };
    } else {
      console.log(colors.red('✗ No se pudieron obtener las grabaciones'));
      return { recordings: [], radioIds: new Set() };
    }
  } catch (err) {
    console.log(colors.red(`✗ Error obteniendo grabaciones: ${err.message}`));
    return { recordings: [], radioIds: new Set() };
  }
}

// Función para encontrar coincidencias
function findMatches(radios, recordingRadioIds) {
  console.log(colors.cyan.bold('\n=== ANÁLISIS DE COINCIDENCIAS ===\n'));
  
  const matches = [];
  const noMatches = [];
  
  recordingRadioIds.forEach(radioId => {
    // Buscar por id_radio
    const matchById = radios.find(radio => radio.id_radio === radioId);
    
    // Buscar por vps_id
    const matchByVpsId = radios.find(radio => radio.vps_id === radioId);
    
    if (matchById || matchByVpsId) {
      const match = matchById || matchByVpsId;
      matches.push({
        recordingRadioId: radioId,
        databaseRadio: match,
        matchType: matchById ? 'id_radio' : 'vps_id'
      });
      console.log(colors.green(`✓ COINCIDENCIA: ${radioId} → ${match.name} (${matchType})`));
    } else {
      noMatches.push(radioId);
      console.log(colors.red(`✗ NO ENCONTRADO: ${radioId}`));
    }
  });
  
  console.log(colors.cyan.bold('\n=== RESUMEN ==='));
  console.log(colors.green(`✓ Coincidencias encontradas: ${matches.length}`));
  console.log(colors.red(`✗ Sin coincidencias: ${noMatches.length}`));
  
  if (noMatches.length > 0) {
    console.log(colors.yellow(`\nIDs faltantes en base de datos: ${noMatches.join(', ')}`));
    console.log(colors.yellow('Estos IDs necesitan ser agregados a la tabla radios.'));
  }
  
  return { matches, noMatches };
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO: RADIOS VS GRABACIONES ===\n'));
  
  try {
    // 1. Obtener radios de la base de datos
    const radios = await getRadiosFromDatabase();
    
    // 2. Obtener grabaciones del VPS
    const { recordings, radioIds } = await getRecordingsFromVPS();
    
    // 3. Analizar coincidencias
    const { matches, noMatches } = findMatches(radios, radioIds);
    
    // 4. Generar recomendaciones
    console.log(colors.cyan.bold('\n=== RECOMENDACIONES ===\n'));
    
    if (noMatches.length > 0) {
      console.log(colors.yellow('Para solucionar el problema, puedes:'));
      console.log('');
      console.log('1. Agregar las radios faltantes a la base de datos:');
      noMatches.forEach(radioId => {
        console.log(`   INSERT INTO radios (id_radio, name, region, city) VALUES ('${radioId}', 'Radio ${radioId}', 'Región', 'Ciudad');`);
      });
      console.log('');
      console.log('2. O actualizar las grabaciones existentes para usar IDs de radio válidos.');
    } else {
      console.log(colors.green('✓ Todas las grabaciones tienen radios correspondientes en la base de datos.'));
      console.log('El problema puede estar en otro lugar.');
    }
    
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