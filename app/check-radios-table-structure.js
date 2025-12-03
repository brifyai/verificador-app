#!/usr/bin/env node

/**
 * VERIFICAR: Estructura de la tabla radios
 * Para entender cómo están almacenados los datos y qué columnas usar
 */

const axios = require('axios');
const colors = require('colors');

// Función para obtener radios desde la base de datos
async function getRadiosFromDatabase() {
  console.log(colors.cyan.bold('\n=== VERIFICANDO ESTRUCTURA DE TABLA RADIOS ===\n'));
  
  try {
    // Usar el endpoint que funciona con autenticación
    const response = await axios.get('http://localhost:3000/api/radios-direct', {
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const radios = response.data.data;
      console.log(colors.green(`✓ Encontradas ${radios.length} radios en la base de datos`));
      
      console.log(colors.cyan.bold('\n=== ESTRUCTURA DE DATOS ==='));
      radios.forEach((radio, index) => {
        console.log(`${index + 1}. Registro completo:`);
        console.log(JSON.stringify(radio, null, 2));
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

// Función para analizar las columnas disponibles
function analyzeColumns(radios) {
  console.log(colors.cyan.bold('\n=== ANÁLISIS DE COLUMNAS ===\n'));
  
  if (radios.length === 0) {
    console.log(colors.yellow('No hay radios para analizar'));
    return;
  }
  
  const sampleRadio = radios[0];
  const columns = Object.keys(sampleRadio);
  
  console.log(colors.yellow('Columnas disponibles en la tabla radios:'));
  columns.forEach((column, index) => {
    const value = sampleRadio[column];
    const type = typeof value;
    console.log(`${index + 1}. ${column}: ${type} = "${value}"`);
  });
  
  console.log(colors.cyan.bold('\n=== BÚSQUEDA DE IDs DE VPS ===\n'));
  
  // Buscar columnas que podrían contener los IDs del VPS
  const possibleIdColumns = columns.filter(col => {
    const value = sampleRadio[col];
    return typeof value === 'string' && (value.includes('mijm') || value.length > 5);
  });
  
  if (possibleIdColumns.length > 0) {
    console.log(colors.green('Posibles columnas para IDs de VPS:'));
    possibleIdColumns.forEach(col => {
      console.log(`- ${col}: "${sampleRadio[col]}"`);
    });
  } else {
    console.log(colors.yellow('No se encontraron columnas obvias para IDs de VPS'));
  }
  
  // Verificar si algún valor coincide con los IDs de las grabaciones
  const vpsIds = ['mijm9xci', 'mijm9xsi'];
  console.log(colors.cyan.bold('\n=== BÚSQUEDA DE COINCIDENCIAS CON IDS DE VPS ===\n'));
  
  vpsIds.forEach(vpsId => {
    const matches = radios.filter(radio => {
      return Object.values(radio).some(value => 
        typeof value === 'string' && value.includes(vpsId)
      );
    });
    
    if (matches.length > 0) {
      console.log(colors.green(`✓ VPS ID "${vpsId}" encontrado en:`));
      matches.forEach(match => {
        console.log(`  - ${JSON.stringify(match)}`);
      });
    } else {
      console.log(colors.red(`✗ VPS ID "${vpsId}" NO encontrado`));
    }
  });
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== ANÁLISIS DE ESTRUCTURA DE TABLA RADIOS ===\n'));
  
  try {
    // 1. Obtener radios de la base de datos
    const radios = await getRadiosFromDatabase();
    
    // 2. Analizar columnas
    analyzeColumns(radios);
    
    console.log(colors.cyan.bold('\n=== RECOMENDACIONES ===\n'));
    console.log('Basado en el análisis, actualiza la API para usar la columna correcta.');
    console.log('Si no encuentras los IDs de VPS, puede que necesites:');
    console.log('1. Agregar una columna vps_id a la tabla radios');
    console.log('2. O mapear los IDs de VPS a los IDs numéricos existentes');
    
    console.log(colors.cyan.bold('\n=== FIN DEL ANÁLISIS ===\n'));
    
  } catch (err) {
    console.log(colors.red(`Error en análisis: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error inesperado: ${err.message}`));
  console.error(err);
});