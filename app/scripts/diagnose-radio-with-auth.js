#!/usr/bin/env node

// Script para diagnosticar radios usando autenticación
const http = require('http');

// Credenciales de administrador (ajustar según tu configuración)
const ADMIN_CREDENTIALS = {
  email: 'admin@ondaverificada.cl',
  password: 'admin123'
};

let authToken = null;

async function login() {
  try {
    console.log('Iniciando sesión como administrador...');
    
    const loginData = {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    };

    const result = await makeApiRequest('/api/auth/login-direct', 'POST', loginData);
    
    if (result.error) {
      console.log('Error en login:', result.error);
      return false;
    }
    
    if (result.token) {
      authToken = result.token;
      console.log('✅ Login exitoso');
      return true;
    } else {
      console.log('❌ No se recibió token de autenticación');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error en login:', error.message);
    return false;
  }
}

async function makeApiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
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

async function diagnoseRadioDifferences() {
  try {
    console.log('🔍 Diagnóstico de diferencias entre radios Fmmas y Fmokey...\n');

    // Primero hacer login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ No se pudo autenticar. Abortando diagnóstico.');
      return;
    }

    // Obtener todos los radios
    console.log('\nObteniendo lista de radios...');
    const allRadios = await makeApiRequest('/api/radios');
    
    if (allRadios.error) {
      console.log('Error obteniendo radios:', allRadios.error);
      console.log('Respuesta cruda:', allRadios.raw);
      return;
    }

    if (!Array.isArray(allRadios)) {
      console.log('Respuesta inesperada:', allRadios);
      return;
    }

    console.log(`✅ Encontrados ${allRadios.length} radios`);

    // Buscar Fmmas y Fmokey
    const radioFmmas = allRadios.find(radio => 
      radio.name && radio.name.toLowerCase().includes('fmmas')
    );
    
    const radioFmokey = allRadios.find(radio => 
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

    const updateResult = await makeApiRequest(`/api/radios/${radioId}`, 'PUT', testData);
    
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
diagnoseRadioDifferences().catch(console.error);