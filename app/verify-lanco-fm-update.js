#!/usr/bin/env node

// Script para verificar que LANCO FM fue actualizada correctamente

require('dotenv').config();

async function verifyLancoFMUpdate() {
  console.log('🔍 Verificando actualización de LANCO FM...\n');
  
  try {
    // Importar el cliente directo
    const { supabaseDirect } = require('./lib/supabase-direct');
    
    // Verificar conexión
    console.log('🔍 Verificando conexión con Supabase...');
    const connectionTest = await supabaseDirect.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Error de conexión:', connectionTest.message);
      return;
    }
    console.log('✅ Conexión exitosa');
    
    // Buscar LANCO FM nuevamente
    console.log('🔍 Buscando LANCO FM actualizada...');
    const radios = await supabaseDirect.getRadios({ limit: 1000 });
    const lancoFM = radios.find(radio => 
      radio.name.toLowerCase().includes('lanco') && 
      (radio.stream_url.includes('chiloestreaming.com:10995') || 
       radio.stream_url.includes('chiloestreaming.com:10989'))
    );
    
    if (!lancoFM) {
      console.log('❌ LANCO FM no encontrada');
      return;
    }
    
    console.log('📊 Estado actual de LANCO FM:');
    console.log(`   📻 Nombre: ${lancoFM.name}`);
    console.log(`   🆔 ID: ${lancoFM.id}`);
    console.log(`   📍 Ciudad: ${lancoFM.city}, ${lancoFM.region}`);
    console.log(`   🔗 URL actual: ${lancoFM.stream_url}`);
    console.log(`   📊 Estado: ${lancoFM.status}`);
    
    // Verificar si tiene la nueva URL
    const expectedUrl = 'https://streaming.chiloestreaming.com:10995/;stream.mp3';
    if (lancoFM.stream_url === expectedUrl) {
      console.log('\n🎉 ¡ACTUALIZACIÓN CONFIRMADA!');
      console.log('✅ LANCO FM ahora tiene la nueva URL funcionando');
      
      // Verificar que el stream esté online
      console.log(`\n🧪 Verificando que el stream esté online...`);
      
      try {
        const https = require('https');
        const { URL } = require('url');
        const urlObj = new URL(lancoFM.stream_url);
        
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
            'Icy-MetaData': '1'
          }
        };
        
        const result = await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let hasAudioData = false;
            
            res.on('data', (chunk) => {
              // Si recibimos datos, es un stream de audio válido
              if (chunk.length > 0) {
                hasAudioData = true;
                res.destroy(); // Cerrar conexión
              }
            });
            
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                hasAudioData: hasAudioData,
                isWorking: res.statusCode === 200 && hasAudioData
              });
            });
            
            res.on('close', () => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                hasAudioData: hasAudioData,
                isWorking: res.statusCode === 200 && hasAudioData
              });
            });
          });
          
          req.on('error', (error) => {
            reject(error);
          });
          
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
          
          req.end();
          
          // Timeout adicional por si acaso
          setTimeout(() => {
            req.destroy();
            resolve({
              status: 0,
              headers: {},
              hasAudioData: false,
              isWorking: false,
              timeout: true
            });
          }, 8000);
        });
        
        console.log(`📊 Resultado de verificación:`);
        console.log(`   📡 Status HTTP: ${result.status}`);
        console.log(`   🎵 Datos de audio recibidos: ${result.hasAudioData ? 'Sí' : 'No'}`);
        console.log(`   ✅ Stream funcionando: ${result.isWorking ? 'Sí' : 'No'}`);
        
        if (result.isWorking) {
          console.log(`\n🎉 ¡STREAM VERIFICADO!`);
          console.log(`✅ LANCO FM está ONLINE y transmitiendo audio`);
          
          // Mostrar información adicional del stream
          if (result.headers['content-type']) {
            console.log(`   🎵 Tipo de contenido: ${result.headers['content-type']}`);
          }
          if (result.headers['icy-name']) {
            console.log(`   📻 Nombre del stream: ${result.headers['icy-name']}`);
          }
          if (result.headers['icy-genre']) {
            console.log(`   🎶 Género: ${result.headers['icy-genre']}`);
          }
          if (result.headers['icy-br']) {
            console.log(`   📊 Bitrate: ${result.headers['icy-br']} kbps`);
          }
          
          console.log(`\n🎯 RESUMEN:`);
          console.log(`   ✅ URL actualizada: ${lancoFM.stream_url}`);
          console.log(`   ✅ Stream verificado: ONLINE`);
          console.log(`   ✅ Estado: ${lancoFM.status}`);
          console.log(`   🎙️  Grabable: Sí (si el servicio de grabación está configurado)`);
          
        } else {
          console.log(`\n⚠️  El stream podría tener problemas`);
          console.log(`   Status: ${result.status}`);
          console.log(`   Audio: ${result.hasAudioData ? 'Sí' : 'No'}`);
          
          if (result.timeout) {
            console.log(`   ⏱️  Timeout: La conexión tardó demasiado`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️  Error verificando stream: ${error.message}`);
        console.log(`ℹ️  Esto podría ser normal dependiendo de la configuración del servidor`);
        console.log(`✅ De todos modos, la URL fue actualizada correctamente`);
      }
      
    } else {
      console.log(`\n⚠️  La URL no coincide con la esperada`);
      console.log(`   Esperada: ${expectedUrl}`);
      console.log(`   Actual:   ${lancoFM.stream_url}`);
      console.log(`❌ La actualización podría no haberse aplicado correctamente`);
    }
    
    // Verificar otras radios de chiloestreaming
    console.log(`\n${'='.repeat(60)}`);
    console.log('📻 OTRAS RADIOS DE CHILOESTREAMING');
    console.log(`${'='.repeat(60)}`);
    
    const chiloestreamingRadios = radios.filter(radio => 
      radio.stream_url && radio.stream_url.includes('chiloestreaming.com')
    );
    
    console.log(`Encontradas ${chiloestreamingRadios.length} radios de chiloestreaming:`);
    
    chiloestreamingRadios.forEach((radio, index) => {
      console.log(`${index + 1}. ${radio.name} - ${radio.city || 'Ciudad no especificada'}`);
      console.log(`   🔗 ${radio.stream_url}`);
      console.log(`   📊 ${radio.status}`);
      
      // Marcar LANCO FM actualizada
      if (radio.id === lancoFM.id) {
        console.log(`   🎯 ¡ESTA RADIO FUE ACTUALIZADA!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar
verifyLancoFMUpdate().catch(console.error);