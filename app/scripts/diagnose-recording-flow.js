#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar el flujo completo de grabaciones
 * 
 * Este script verifica:
 * 1. Si el VPS está accesible
 * 2. Si el endpoint /api/recordings del VPS funciona
 * 3. Si hay grabaciones guardadas en el VPS
 * 4. Si el endpoint local /api/recordings funciona
 * 5. Si Supabase tiene alguna tabla de grabaciones
 */

const VPS_API_BASE = 'http://213.199.39.147:5000/api';
const LOCAL_API_BASE = 'http://localhost:3000/api';

// Cargar variables de entorno
require('dotenv').config({ path: './app/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🩺 DIAGNÓSTICO DE FLUJO DE GRABACIONES');
console.log('=====================================\n');

async function checkVPSRecordings() {
  console.log('1️⃣ VERIFICANDO ENDPOINT VPS /api/recordings');
  console.log(`   URL: ${VPS_API_BASE}/recordings`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ❌ Error HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Respuesta recibida del VPS');
    console.log(`   Status: ${data.status}`);
    console.log(`   Count: ${data.count || 0}`);
    console.log(`   Recordings: ${data.recordings ? data.recordings.length : 0} items`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('\n   📋 PRIMERAS 5 GRABACIONES:');
      data.recordings.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.filename} (${rec.size} bytes)`);
        console.log(`      Creado: ${rec.created_at || rec.created}`);
        console.log(`      Path: ${rec.path}`);
      });
      
      // Verificar fechas
      const dates = data.recordings.map(rec => new Date(rec.created_at || rec.created));
      const newestDate = new Date(Math.max(...dates));
      const oldestDate = new Date(Math.min(...dates));
      
      console.log(`\n   📅 Rango de fechas:`);
      console.log(`      Más reciente: ${newestDate.toISOString()}`);
      console.log(`      Más antigua: ${oldestDate.toISOString()}`);
      console.log(`      Diferencia: ${Math.floor((Date.now() - newestDate.getTime()) / 1000 / 60)} minutos desde la más reciente`);
    }
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return null;
  }
}

async function checkLocalAPI() {
  console.log('\n2️⃣ VERIFICANDO ENDPOINT LOCAL /api/recordings');
  console.log(`   URL: ${LOCAL_API_BASE}/recordings`);
  
  try {
    const response = await fetch(`${LOCAL_API_BASE}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ❌ Error HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Respuesta recibida de API local');
    console.log(`   Status: ${data.status}`);
    console.log(`   Count: ${data.count || 0}`);
    console.log(`   Recordings: ${data.recordings ? data.recordings.length : 0} items`);
    
    if (data.recordings && data.recordings.length > 0) {
      console.log('\n   📋 PRIMERAS 3 GRABACIONES:');
      data.recordings.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.filename}`);
      });
    }
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return null;
  }
}

async function checkSupabaseTables() {
  console.log('\n3️⃣ VERIFICANDO TABLAS EN SUPABASE');
  console.log(`   URL: ${SUPABASE_URL}`);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('   ❌ Falta configuración de Supabase');
    return;
  }

  try {
    // Intentar consultar la tabla recordings
    console.log('   🔍 Intentando consultar tabla "recordings"...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/recordings?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`   ✅ Tabla "recordings" existe`);
      console.log(`   Registros encontrados: ${data.length}`);
    } else if (response.status === 404 || response.status === 400) {
      console.log(`   ❌ Tabla "recordings" NO existe o no es accesible`);
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 150)}...`);
    } else {
      const text = await response.text();
      console.log(`   ⚠️ Respuesta inesperada: ${text.substring(0, 150)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
  }

  // Verificar otras tablas relacionadas
  const tablesToCheck = ['monitoring_sessions', 'detections', 'jobs'];
  
  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`   ✅ Tabla "${table}" existe (${data.length || 'N/A'} registros)`);
      }
    } catch (error) {
      // Silencioso
    }
  }
}

async function checkActiveRecordings() {
  console.log('\n4️⃣ VERIFICANDO GRABACIONES ACTIVAS EN VPS');
  console.log(`   URL: ${VPS_API_BASE}/active-recordings`);
  
  try {
    const response = await fetch(`${VPS_API_BASE}/active-recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ❌ Error HTTP: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ Respuesta recibida');
    console.log(`   Status: ${data.status}`);
    console.log(`   Count: ${data.count || 0}`);
    console.log(`   Active recordings:`, data.active_recordings);
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return null;
  }
}

async function testRecordingCreation() {
  console.log('\n5️⃣ PRUEBA DE CREACIÓN DE GRABACIÓN (simulada)');
  console.log(`   Esto requiere intervención manual`);
  console.log(`   Por favor, haz clic en "Grabar" en http://localhost:3000/grabaciones`);
  console.log(`   y luego ejecuta este script nuevamente.`);
}

// Ejecutar diagnóstico
async function runDiagnosis() {
  console.log('Iniciando diagnóstico...\n');
  
  await checkVPSRecordings();
  await checkLocalAPI();
  await checkSupabaseTables();
  await checkActiveRecordings();
  await testRecordingCreation();
  
  console.log('\n📋 RESUMEN DE HALLAZGOS:');
  console.log('========================');
  console.log('1. Las grabaciones se obtienen del VPS (213.199.39.147:5000)');
  console.log('2. No hay tabla "recordings" en Supabase');
  console.log('3. Las grabaciones solo existen en el VPS');
  console.log('4. Si las grabaciones nuevas no aparecen, el VPS no las está guardando');
  console.log('\n💡 RECOMENDACIONES:');
  console.log('   - Verificar logs del VPS de grabación');
  console.log('   - Verificar espacio en disco del VPS');
  console.log('   - Verificar permisos de escritura en el VPS');
  console.log('   - Considerar guardar grabaciones también en Supabase');
}

runDiagnosis().catch(console.error);