#!/usr/bin/env node

// Script para diagnosticar radios usando endpoints directos sin autenticación
const http = require('http');

async function makeDirectRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
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

async function diagnoseRadioDifferences() {
  try {
    console.log('🔍 Diagnóstico de diferencias entre radios Fmmas y Fmokey...\n');

    // Intentar obtener estadísticas directas
    console.log('Obteniendo estadísticas directas...');
    const stats = await makeDirectRequest('/api/dashboard/stats-direct');
    
    if (stats.error) {
      console.log('Error obteniendo estadísticas:', stats.error);
      if (stats.raw) {
        console.log('Respuesta cruda:', stats.raw);
      }
    } else {
      console.log('Estadísticas obtenidas:', JSON.stringify(stats, null, 2));
    }

    // Intentar obtener deteccciones directas
    console.log('\nObteniendo detecciones directas...');
    const detections = await makeDirectRequest('/api/detecciones-direct');
    
    if (detections.error) {
      console.log('Error obteniendo detecciones:', detections.error);
    } else {
      console.log('Detecciones obtenidas:', JSON.stringify(detections, null, 2));
    }

    // Intentar obtener configuraciones API directas
    console.log('\nObteniendo configuraciones API directas...');
    const apiConfigs = await makeDirectRequest('/api/api-configurations-direct');
    
    if (apiConfigs.error) {
      console.log('Error obteniendo configuraciones API:', apiConfigs.error);
    } else {
      console.log('Configuraciones API obtenidas:', JSON.stringify(apiConfigs, null, 2));
    }

    // Ahora vamos a intentar acceder a la interfaz web directamente
    console.log('\n=== ANÁLISIS DE LA INTERFAZ WEB ===');
    
    // Intentar acceder a la página principal
    console.log('Accediendo a la página principal...');
    const mainPage = await makeDirectRequest('/');
    
    if (mainPage.error) {
      console.log('Error accediendo a la página principal:', mainPage.error);
    } else {
      console.log('✅ Página principal accesible');
    }

    // Intentar acceder a la página de login
    console.log('Accediendo a la página de login...');
    const loginPage = await makeDirectRequest('/login');
    
    if (loginPage.error) {
      console.log('Error accediendo a la página de login:', loginPage.error);
    } else {
      console.log('✅ Página de login accesible');
    }

    // Si podemos acceder a la interfaz, intentar obtener más información
    console.log('\n=== INFORMACIÓN DISPONIBLE ===');
    
    // Buscar radios en las respuestas que obtuvimos
    let allRadios = [];
    
    if (stats.radios && Array.isArray(stats.radios)) {
      allRadios = stats.radios;
    } else if (detections.radios && Array.isArray(detections.radios)) {
      allRadios = detections.radios;
    } else if (apiConfigs.radios && Array.isArray(apiConfigs.radios)) {
      allRadios = apiConfigs.radios;
    }

    if (allRadios.length > 0) {
      console.log(`✅ Encontrados ${allRadios.length} radios en los datos`);
      
      // Buscar Fmmas y Fmokey
      const radioFmmas = allRadios.find(radio => 
        radio.name && radio.name.toLowerCase().includes('fmmas')
      );
      
      const radioFmokey = allRadios.find(radio => 
        radio.name && radio.name.toLowerCase().includes('fmokey')
      );

      analyzeRadios(radioFmmas, radioFmokey);
      
    } else {
      console.log('ℹ️ No se encontraron radios en los datos disponibles');
      
      // Intentar obtener información de otras fuentes
      console.log('\nBuscando información en detecciones...');
      
      if (detections.detecciones && Array.isArray(detections.detecciones)) {
        const detecciones = detections.detecciones;
        console.log(`Encontradas ${detecciones.length} detecciones`);
        
        // Buscar referencias a radios en las detecciones
        const radioRefs = new Set();
        detecciones.forEach(detection => {
          if (detection.radio_id) radioRefs.add(detection.radio_id);
          if (detection.radio_name) radioRefs.add(detection.radio_name);
        });
        
        console.log('Referencias a radios encontradas:', Array.from(radioRefs));
      }
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

function analyzeRadios(radioFmmas, radioFmokey) {
  console.log('\n=== ANÁLISIS DE RADIOS ESPECÍFICOS ===');

  console.log('=== RADIO Fmmas ===');
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