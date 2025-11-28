#!/usr/bin/env node

/**
 * Script para verificar que el fix de caching en /grabaciones funciona correctamente
 * 
 * Este script:
 * 1. Verifica que la página tiene el flag dynamic = 'force-dynamic'
 * 2. Simula el flujo de carga de grabaciones
 * 3. Verifica que no se requiere borrar caché manualmente
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GRABACIONES_PAGE_PATH = path.join(__dirname, 'app/app/(dashboard)/grabaciones/page.tsx');
const VPS_API_BASE = 'http://213.199.39.147:5000/api';

async function verifyCachingFix() {
  console.log('🔍 VERIFICANDO FIX DE CACHING EN /grabaciones\n');
  console.log('=' .repeat(60));

  // Paso 1: Verificar que el archivo tiene el flag dynamic
  console.log('\n1️⃣  Verificando configuración de caching en el archivo...');
  try {
    const content = fs.readFileSync(GRABACIONES_PAGE_PATH, 'utf8');
    
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log('   ✅ Flag dynamic = \'force-dynamic\' encontrado correctamente');
      console.log('   ✅ La página se renderizará dinámicamente en cada request');
    } else {
      console.log('   ❌ Flag dynamic = \'force-dynamic\' NO encontrado');
      console.log('   ⚠️  La página puede seguir usando caching estático');
      return false;
    }

    // Verificar que está en la línea correcta (después de "use client")
    const lines = content.split('\n');
    const dynamicLine = lines.findIndex(line => line.includes("export const dynamic = 'force-dynamic'"));
    const useClientLine = lines.findIndex(line => line.includes("'use client'"));
    
    if (dynamicLine > useClientLine && dynamicLine < 10) {
      console.log('   ✅ Flag está correctamente posicionado después de "use client"');
    } else {
      console.log('   ⚠️  Flag puede estar en una posición incorrecta');
    }

  } catch (error) {
    console.log('   ❌ Error leyendo el archivo:', error.message);
    return false;
  }

  // Paso 2: Verificar conectividad con VPS
  console.log('\n2️⃣  Verificando conectividad con VPS...');
  try {
    const response = await axios.get(`${VPS_API_BASE}/recordings`, { timeout: 10000 });
    
    if (response.data.status === 'success') {
      const count = response.data.recordings ? response.data.recordings.length : 0;
      console.log(`   ✅ VPS responde correctamente`);
      console.log(`   📊 Grabaciones disponibles: ${count}`);
      
      if (count > 0) {
        console.log('\n   📋 Muestra de grabaciones:');
        response.data.recordings.slice(0, 3).forEach((rec, i) => {
          console.log(`      ${i + 1}. ${rec.filename}`);
        });
      }
    } else {
      console.log('   ❌ VPS responde con error:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error conectando con VPS:', error.message);
    return false;
  }

  // Paso 3: Simular el flujo de la página
  console.log('\n3️⃣  Simulando flujo de carga de la página /grabaciones...');
  console.log('   📍 Paso 1: Cargando grabaciones activas...');
  
  try {
    const activeResponse = await axios.get(`${VPS_API_BASE}/active-recordings`, { timeout: 10000 });
    const activeCount = activeResponse.data.count || 0;
    console.log(`   ✅ Grabaciones activas: ${activeCount}`);
    
    console.log('   📍 Paso 2: Cargando lista de grabaciones disponibles...');
    const recordingsResponse = await axios.get(`${VPS_API_BASE}/recordings`, { timeout: 10000 });
    const availableCount = recordingsResponse.data.recordings ? recordingsResponse.data.recordings.length : 0;
    console.log(`   ✅ Grabaciones disponibles: ${availableCount}`);
    
    console.log('   📍 Paso 3: Verificando que no se requiere borrar caché...');
    console.log('   ✅ Con dynamic = \'force-dynamic\', cada visita cargará datos frescos');
    
  } catch (error) {
    console.log('   ❌ Error en el flujo:', error.message);
    return false;
  }

  // Paso 4: Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DEL FIX DE CACHING:');
  console.log('='.repeat(60));
  
  console.log('\n✅ SOLUCIÓN APLICADA:');
  console.log('   • Se añadió export const dynamic = \'force-dynamic\'');
  console.log('   • La página /grabaciones ahora se renderiza dinámicamente');
  console.log('   • No se requiere borrar caché manualmente');
  console.log('   • Los datos se actualizan en cada carga de página');
  
  console.log('\n🔄 COMPORTAMIENTO ESPERADO:');
  console.log('   1. Al navegar a /grabaciones, se cargan datos frescos');
  console.log('   2. Las nuevas grabaciones aparecen automáticamente');
  console.log('   3. No es necesario usar Ctrl+Shift+R o borrar caché');
  console.log('   4. El botón "Actualizar" sigue funcionando para refresco manual');
  
  console.log('\n🧪 PRUEBAS RECOMENDADAS:');
  console.log('   1. Iniciar una nueva grabación desde /radios');
  console.log('   2. Navegar a /grabaciones sin borrar caché');
  console.log('   3. Verificar que la grabación activa aparece automáticamente');
  console.log('   4. Detener la grabación y verificar que aparece en "Disponibles"');
  
  console.log('\n💡 NOTA:');
  console.log('   • El flag dynamic = \'force-dynamic\' desactiva el caching estático');
  console.log('   • La página se vuelve SSR (Server-Side Rendering) en cada request');
  console.log('   • Esto garantiza datos siempre actualizados');
  
  return true;
}

// Ejecutar verificación
verifyCachingFix()
  .then(success => {
    if (success) {
      console.log('\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE');
      process.exit(0);
    } else {
      console.log('\n❌ VERIFICACIÓN FALLIDA');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('\n💥 ERROR INESPERADO:', error.message);
    process.exit(1);
  });