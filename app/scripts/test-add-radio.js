#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

// Configuración
const API_BASE = 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testAddRadio() {
  console.log('🧪 DIAGNÓSTICO: Agregar Radio al Sistema');
  console.log('========================================\n');

  try {
    // Paso 1: Verificar conexión a Supabase directa
    console.log('1️⃣ Verificando conexión a Supabase...');
    try {
      const supabaseRes = await axios.get(
        `${SUPABASE_URL}/rest/v1/radios?select=count&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      console.log(`   ✅ Conexión a Supabase: OK (${supabaseRes.data[0]?.count || 0} radios existentes)`);
    } catch (error) {
      console.log(`   ❌ Error conectando a Supabase: ${error.message}`);
      console.log(`   🔍 URL: ${SUPABASE_URL}`);
      console.log(`   🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    }

    // Paso 2: Verificar endpoint de radios
    console.log('\n2️⃣ Verificando endpoint /api/radios-direct...');
    try {
      const radiosRes = await axios.get(`${API_BASE}/api/radios-direct?limit=5`);
      if (radiosRes.data && Array.isArray(radiosRes.data.data)) {
        console.log(`   ✅ Endpoint funcional: ${radiosRes.data.data.length} radios encontradas`);
        if (radiosRes.data.data.length > 0) {
          console.log(`   📻 Ejemplo: ${radiosRes.data.data[0].name} (${radiosRes.data.data[0].region})`);
        }
      } else {
        console.log(`   ❌ Formato inesperado:`, radiosRes.data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📄 Data: ${JSON.stringify(error.response.data)}`);
      }
    }

    // Paso 3: Intentar crear una radio de prueba
    console.log('\n3️⃣ Intentando crear una radio de prueba...');
    
    const testRadio = {
      name: `Radio Diagnóstico ${Date.now()}`,
      streamUrl: 'https://stream.biobio.cl/bb',
      streamPlatform: 'direct',
      region: 'Metropolitana',
      city: 'Santiago',
      isActive: true,
      genre: 'Noticias',
      programadora: 'Diagnóstico',
      frequency: '99.9 FM',
      website: 'https://www.diagnostico.cl'
    };

    console.log(`   📻 Datos a enviar: ${JSON.stringify(testRadio, null, 2)}`);

    try {
      const createRes = await axios.post(`${API_BASE}/api/radios`, testRadio, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Importante: permitir que axios maneje las cookies de sesión
        withCredentials: true
      });

      console.log(`   ✅ Radio creada exitosamente!`);
      console.log(`   📊 Respuesta: ${JSON.stringify(createRes.data, null, 2)}`);
      
      if (createRes.data.success) {
        console.log(`   🎉 ID de la nueva radio: ${createRes.data.data.id}`);
      }
    } catch (error) {
      console.log(`   ❌ Error al crear radio: ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📄 Error: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Análisis específico de errores
        if (error.response.status === 401) {
          console.log(`   🔍 Causa: No autenticado. Inicia sesión en http://localhost:3000/auth/signin`);
        } else if (error.response.status === 400) {
          console.log(`   🔍 Causa: Datos inválidos - ${JSON.stringify(error.response.data.details || error.response.data)}`);
        } else if (error.response.status === 409) {
          console.log(`   🔍 Causa: Radio duplicada (mismo nombre y región)`);
        } else if (error.response.status === 500) {
          console.log(`   🔍 Causa: Error interno del servidor`);
        }
      } else if (error.request) {
        console.log(`   🔍 No hubo respuesta del servidor. Verifica que Next.js esté corriendo.`);
      } else {
        console.log(`   🔍 Error de configuración: ${error.message}`);
      }
    }

    // Paso 4: Verificar si la radio se guardó en Supabase
    console.log('\n4️⃣ Verificando si la radio se guardó en Supabase...');
    try {
      const verifyRes = await axios.get(
        `${SUPABASE_URL}/rest/v1/radios?name=eq.${encodeURIComponent(testRadio.name)}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (verifyRes.data && verifyRes.data.length > 0) {
        console.log(`   ✅ Radio encontrada en Supabase!`);
        console.log(`   📊 Datos: ${JSON.stringify(verifyRes.data[0], null, 2)}`);
      } else {
        console.log(`   ❌ Radio NO encontrada en Supabase`);
      }
    } catch (error) {
      console.log(`   ❌ Error verificando en Supabase: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  } finally {
    rl.close();
  }
}

// Ejecutar el diagnóstico
testAddRadio().then(() => {
  console.log('\n✅ Diagnóstico completado.');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error en el diagnóstico:', error);
  process.exit(1);
});