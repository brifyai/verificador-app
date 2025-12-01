#!/usr/bin/env node

const { Client } = require('pg');

async function diagnoseRadioDifferences() {
  let client;
  try {
    console.log('🔍 Diagnóstico de diferencias entre radios Fmmas y Fmokey...\n');

    // Conexión directa a PostgreSQL usando la DATABASE_URL del .env.example
    const connectionString = 'postgresql://ondauser:123456@localhost:5432/ondaverificada_dev';
    
    client = new Client({
      connectionString: connectionString
    });

    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Buscar los radios específicos
    const fmmasQuery = `
      SELECT id, name, url, platform, status, metadata, created_at, updated_at 
      FROM radios 
      WHERE LOWER(name) LIKE '%fmmas%'
      LIMIT 1;
    `;
    
    const fmokeyQuery = `
      SELECT id, name, url, platform, status, metadata, created_at, updated_at 
      FROM radios 
      WHERE LOWER(name) LIKE '%fmokey%'
      LIMIT 1;
    `;

    const fmmasResult = await client.query(fmmasQuery);
    const fmokeyResult = await client.query(fmokeyQuery);

    const radioFmmas = fmmasResult.rows[0];
    const radioFmokey = fmokeyResult.rows[0];

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

    // Verificar si hay más radios con nombres similares
    console.log('\n=== BÚSQUEDA DE RADIOS SIMILARES ===');
    const similarQuery = `
      SELECT id, name, url, platform, status, created_at
      FROM radios 
      WHERE LOWER(name) LIKE '%fmm%' OR LOWER(name) LIKE '%fmo%'
      ORDER BY name;
    `;
    
    const similarResult = await client.query(similarQuery);
    
    console.log('Radios encontradas con nombres similares:');
    similarResult.rows.forEach(radio => {
      console.log(`- ${radio.name} (ID: ${radio.id}, Platform: ${radio.platform}, Status: ${radio.status})`);
    });

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    if (client) {
      await client.end();
    }
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