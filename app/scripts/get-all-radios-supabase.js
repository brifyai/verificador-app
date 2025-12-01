#!/usr/bin/env node

// Script para obtener todos los radios de Supabase directamente
const https = require('https');

// Configuración de Supabase
const SUPABASE_URL = 'https://ondaverificada.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZGF2ZXJpZmljYWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MTQ5MzQsImV4cCI6MjA0ODQ5MDkzNH0.0rSKDqS8xL3M0d3Xx8mHgdB5vV8yK7QlG2zN4pR7sT9';

async function makeSupabaseRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ondaverificada.supabase.co',
      port: 443,
      path: `/rest/v1/${endpoint}`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function getAllRadios() {
  try {
    console.log('🔍 Obteniendo todos los radios de Supabase...\n');

    // Obtener todos los radios
    console.log('Obteniendo lista de radios...');
    const radios = await makeSupabaseRequest('radios?select=*');
    
    if (radios.error) {
      console.log('Error obteniendo radios:', radios.error);
      if (radios.raw) {
        console.log('Respuesta cruda:', radios.raw);
      }
      return;
    }

    if (!Array.isArray(radios)) {
      console.log('Respuesta inesperada:', radios);
      return;
    }

    console.log(`✅ Encontrados ${radios.length} radios`);

    // Buscar Fmmas y Fmokey
    const radioFmmas = radios.find(radio => 
      radio.name && radio.name.toLowerCase().includes('fmmas')
    );
    
    const radioFmokey = radios.find(radio => 
      radio.name && radio.name.toLowerCase().includes('fmokey')
    );

    console.log('\n=== RADIO Fmmas ===');
    if (radioFmmas) {
      console.log('ID:', radioFmmas.id);
      console.log('Nombre:', radioFmmas.name);
      console.log('URL:', radioFmmas.url);
      console.log('Plataforma:', radioFmmas.platform);
      console.log('Estado:', radioFmmas.status);
      console.log('Metadata:', JSON.stringify(radioFmmas.metadata, null, 2));
      console.log('Creado:', radioFmmas.created_at);
      console.log('Actualizado:', radioFmmas.updated_at);
    } else {
      console.log('❌ Radio Fmmas no encontrado');
    }

    console.log('\n=== RADIO Fmokey ===');
    if (radioFmokey) {
      console.log('ID:', radioFmokey.id);
      console.log('Nombre:', radioFmokey.name);
      console.log('URL:', radioFmokey.url);
      console.log('Plataforma:', radioFmokey.platform);
      console.log('Estado:', radioFmokey.status);
      console.log('Metadata:', JSON.stringify(radioFmokey.metadata, null, 2));
      console.log('Creado:', radioFmokey.created_at);
      console.log('Actualizado:', radioFmokey.updated_at);
    } else {
      console.log('❌ Radio Fmokey no encontrado');
    }

    if (radioFmmas && radioFmokey) {
      console.log('\n=== ANÁLISIS COMPARATIVO ===');
      
      // Comparar estructuras
      console.log('\n1. Diferencias en campos directos:');
      console.log('- ID:', radioFmmas.id === radioFmokey.id ? '✅ Igual' : '❌ Diferente');
      console.log('- Nombre:', radioFmmas.name === radioFmokey.name ? '✅ Igual' : '❌ Diferente');
      console.log('- URL:', radioFmmas.url === radioFmokey.url ? '✅ Igual' : '❌ Diferente');
      console.log('- Plataforma:', radioFmmas.platform === radioFmokey.platform ? '✅ Igual' : '❌ Diferente');
      console.log('- Estado:', radioFmmas.status === radioFmokey.status ? '✅ Igual' : '❌ Diferente');

      // Analizar URLs
      console.log('\n2. Análisis de URLs:');
      console.log('Fmmas URL:', radioFmmas.url);
      console.log('Fmokey URL:', radioFmokey.url);
      
      const fmmasUrlPattern = analyzeUrlPattern(radioFmmas.url);
      const fmokeyUrlPattern = analyzeUrlPattern(radioFmokey.url);
      
      console.log('Fmmas patrón:', fmmasUrlPattern);
      console.log('Fmokey patrón:', fmokeyUrlPattern);

      // Analizar metadata
      console.log('\n3. Análisis de metadata:');
      const fmmasMeta = radioFmmas.metadata || {};
      const fmokeyMeta = radioFmokey.metadata || {};
      
      console.log('Fmmas metadata keys:', Object.keys(fmmasMeta));
      console.log('Fmokey metadata keys:', Object.keys(fmokeyMeta));
      
      // Buscar diferencias en metadata
      const allKeys = new Set([...Object.keys(fmmasMeta), ...Object.keys(fmokeyMeta)]);
      console.log('\nDiferencias en campos de metadata:');
      allKeys.forEach(key => {
        const fmmasValue = fmmasMeta[key];
        const fmokeyValue = fmokeyMeta[key];
        if (fmmasValue !== fmokeyValue) {
          console.log(`- ${key}: Fmmas="${fmmasValue}" vs Fmokey="${fmokeyValue}"`);
        }
      });

      // Verificar si hay caracteres especiales problemáticos
      console.log('\n4. Análisis de caracteres especiales:');
      checkSpecialCharacters(radioFmmas, 'Fmmas');
      checkSpecialCharacters(radioFmokey, 'Fmokey');

      // Verificar longitud de campos
      console.log('\n5. Análisis de longitudes:');
      console.log('Fmmas - Longitud nombre:', radioFmmas.name.length);
      console.log('Fmokey - Longitud nombre:', radioFmokey.name.length);
      console.log('Fmmas - Longitud URL:', radioFmmas.url?.length || 0);
      console.log('Fmokey - Longitud URL:', radioFmokey.url?.length || 0);

      // Probar actualización de Fmmas
      console.log('\n=== PRUEBA DE ACTUALIZACIÓN Fmmas ===');
      await testRadioUpdate(radioFmmas.id, 'Fmmas');

      // Probar actualización de Fmokey
      console.log('\n=== PRUEBA DE ACTUALIZACIÓN Fmokey ===');
      await testRadioUpdate(radioFmokey.id, 'Fmokey');
    }

    // Mostrar algunos ejemplos de otros radios para comparación
    console.log('\n=== MUESTRA DE OTROS RADIOS ===');
    const sampleRadios = radios.slice(0, 5);
    sampleRadios.forEach(radio => {
      console.log(`- ${radio.name} (ID: ${radio.id}, Platform: ${radio.platform}, Status: ${radio.status})`);
    });

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

async function testRadioUpdate(radioId, radioName) {
  try {
    console.log(`Probando actualización de ${radioName} (ID: ${radioId})...`);
    
    // Intentar actualizar el nombre ligeramente
    const testData = {
      name: `${radioName} (Test ${Date.now()})`,
      platform: 'other'
    };

    const updateResult = await makeSupabaseRequest(`radios?id=eq.${radioId}`, 'PATCH', testData);
    
    if (updateResult.error) {
      console.log(`❌ Error actualizando ${radioName}:`, updateResult.error);
      if (updateResult.details) {
        console.log('Detalles:', updateResult.details);
      }
      if (updateResult.raw) {
        console.log('Respuesta cruda:', updateResult.raw);
      }
    } else {
      console.log(`✅ ${radioName} actualizado exitosamente`);
      console.log('Respuesta:', JSON.stringify(updateResult, null, 2));
    }
    
  } catch (error) {
    console.log(`❌ Error en prueba de ${radioName}:`, error.message);
  }
}

async function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'ondaverificada.supabase.co',
      port: 443,
      path: `/rest/v1/${endpoint}`,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
      options.headers['Prefer'] = 'return=representation';
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: responseData, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

function analyzeUrlPattern(url) {
  if (!url) return 'No URL';
  
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hasSpecialChars: /[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]/.test(url)
    };
  } catch (error) {
    return 'URL inválida';
  }
}

function checkSpecialCharacters(radio, prefix) {
  const fields = ['name', 'url'];
  fields.forEach(field => {
    const value = radio[field];
    if (value && /[^\x00-\x7F]/.test(value)) {
      console.log(`${prefix} - ${field} tiene caracteres no ASCII:`, value);
    }
    if (value && /[<>:"/\\|?*]/.test(value)) {
      console.log(`${prefix} - ${field} tiene caracteres problemáticos:`, value);
    }
  });
}

// Ejecutar el diagnóstico
getAllRadios().catch(console.error);