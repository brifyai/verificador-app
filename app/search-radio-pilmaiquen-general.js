#!/usr/bin/env node

// Script para buscar Radio Pilmaiquen usando el endpoint general que funciona
const fs = require('fs');
const path = require('path');

// Leer el token desde el archivo
const tokenPath = path.join(__dirname, 'valid-token.txt');
let token;

try {
  token = fs.readFileSync(tokenPath, 'utf8').trim();
  console.log('✅ Token cargado:', token.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ Error al leer el token:', error.message);
  process.exit(1);
}

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api/radios-direct';
const LIMIT = 100; // Procesar más radios por página para ser más eficiente

// Función para hacer peticiones a la API
async function makeApiCall(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    throw error;
  }
}

// Función principal de búsqueda
async function searchForPilmaiquen() {
  console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
  console.log('========================================');
  console.log('');

  let offset = 0;
  let found = false;
  let totalProcessed = 0;

  try {
    while (!found) {
      console.log(`📄 Buscando en página ${Math.floor(offset / LIMIT) + 1} (offset: ${offset})...`);
      
      const url = `${API_BASE_URL}?limit=${LIMIT}&offset=${offset}`;
      const data = await makeApiCall(url);

      if (!data.radios || data.radios.length === 0) {
        console.log('📊 No hay más radios para procesar');
        break;
      }

      // Buscar Radio Pilmaiquen en esta página
      for (const radio of data.radios) {
        totalProcessed++;
        
        // Buscar por nombre (case insensitive)
        if (radio.name && radio.name.toLowerCase().includes('pilmaiquen')) {
          console.log('');
          console.log('🎉 ¡RADIO ENCONTRADA!');
          console.log('═══════════════════════════════════════════════════════════════════════════════════════');
          console.log(`📻 Nombre: ${radio.name}`);
          console.log(`🆔 ID: ${radio.id}`);
          console.log(`🌍 Región: ${radio.region}`);
          console.log(`🔗 URL actual: ${radio.stream_url}`);
          console.log(`📊 Estado: ${radio.status}`);
          console.log('═══════════════════════════════════════════════════════════════════════════════════════');
          console.log('');
          
          found = true;
          break;
        }

        // También buscar en la URL por si acaso
        if (radio.stream_url && radio.stream_url.toLowerCase().includes('pilmaiquen')) {
          console.log('');
          console.log('🎉 ¡RADIO ENCONTRADA POR URL!');
          console.log('═══════════════════════════════════════════════════════════════════════════════════════');
          console.log(`📻 Nombre: ${radio.name}`);
          console.log(`🆔 ID: ${radio.id}`);
          console.log(`🌍 Región: ${radio.region}`);
          console.log(`🔗 URL actual: ${radio.stream_url}`);
          console.log(`📊 Estado: ${radio.status}`);
          console.log('═══════════════════════════════════════════════════════════════════════════════════════');
          console.log('');
          
          found = true;
          break;
        }
      }

      if (found) {
        break;
      }

      console.log(`   Procesadas ${data.radios.length} radios en esta página`);
      console.log(`   Total procesadas: ${totalProcessed}`);
      console.log('');

      offset += LIMIT;

      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!found) {
      console.log('');
      console.log('❌ Radio Pilmaiquen no encontrada en la base de datos');
      console.log(`📊 Total de radios procesadas: ${totalProcessed}`);
      console.log('');
      console.log('💡 Sugerencias:');
      console.log('   - Verifica el nombre exacto de la radio');
      console.log('   - La radio podría tener un nombre diferente');
      console.log('   - Busca en el panel de administración web');
      console.log('   - Contacta al administrador del sistema');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error durante la búsqueda:', error.message);
    console.log(`📊 Total de radios procesadas antes del error: ${totalProcessed}`);
  }

  console.log('✅ Búsqueda completada');
}

// Ejecutar la búsqueda
searchForPilmaiquen().catch(console.error);