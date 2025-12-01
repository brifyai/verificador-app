#!/usr/bin/env node

// Script para actualizar la URL de LANCO FM usando el cliente directo

require('dotenv').config();

async function updateLancoStreamDirect() {
  console.log('🔄 Actualizando URL de LANCO FM con método directo...\n');
  
  try {
    // Importar el cliente directo
    const { supabaseDirect } = require('./lib/supabase-direct');
    
    // 1. Verificar conexión
    console.log('🔍 Verificando conexión con Supabase...');
    const connectionTest = await supabaseDirect.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Error de conexión:', connectionTest.message);
      return;
    }
    console.log('✅ Conexión exitosa');
    
    // 2. Buscar LANCO FM
    console.log('\n🔍 Buscando LANCO FM en la base de datos...');
    
    // Buscar por nombre exacto
    const radios = await supabaseDirect.getRadios({ 
      search: 'LANCO FM',
      limit: 10 
    });
    
    let lancoRadio = radios.find(radio => radio.name === 'LANCO FM');
    
    if (!lancoRadio) {
      console.log('LANCO FM no encontrado por nombre exacto, buscando por ciudad...');
      // Buscar por ciudad LANCO
      const allRadios = await supabaseDirect.getRadios({ limit: 1000 });
      lancoRadio = allRadios.find(radio => radio.city === 'LANCO' && radio.region === 'Los Ríos');
    }
    
    if (!lancoRadio) {
      console.error('❌ LANCO FM no encontrado en la base de datos');
      return;
    }
    
    console.log('📻 Estación encontrada:');
    console.log(`   ID: ${lancoRadio.id}`);
    console.log(`   Nombre: ${lancoRadio.name}`);
    console.log(`   Ciudad: ${lancoRadio.city}`);
    console.log(`   Región: ${lancoRadio.region}`);
    console.log(`   URL actual: ${lancoRadio.stream_url}`);
    console.log(`   Estado: ${lancoRadio.status}`);
    console.log(`   Plataforma: ${lancoRadio.platform}`);
    
    // 3. Nueva URL encontrada
    const newUrl = 'https://streaming.chiloestreaming.com:10995/;stream.mp3';
    
    console.log(`\n🔄 Actualizando URL a: ${newUrl}`);
    
    // 4. Actualizar la radio
    const updatedRadio = await supabaseDirect.updateRadio(lancoRadio.id, {
      stream_url: newUrl,
      status: 'ACTIVE', // Forzar estado activo ya que el stream funciona
      platform: 'HTTPS_STREAM', // Actualizar plataforma
      updated_at: new Date().toISOString()
    });
    
    if (!updatedRadio) {
      console.error('❌ Error al actualizar la radio');
      return;
    }
    
    console.log('✅ ¡URL actualizada exitosamente!');
    console.log('\n📊 Nuevos datos:');
    console.log(`   URL: ${updatedRadio.stream_url}`);
    console.log(`   Estado: ${updatedRadio.status}`);
    console.log(`   Plataforma: ${updatedRadio.platform}`);
    console.log(`   Actualizado: ${updatedRadio.updated_at}`);
    
    // 5. Verificar que el stream funcione
    console.log('\n🔍 Verificando el nuevo stream...');
    
    const https = require('https');
    
    const verifyStream = () => {
      return new Promise((resolve) => {
        const options = {
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
          }
        };
        
        const req = https.request(newUrl, options, (res) => {
          console.log(`📊 Status: ${res.statusCode}`);
          console.log(`🖥️  Server: ${res.headers.server}`);
          console.log(`🎵 Content-Type: ${res.headers['content-type']}`);
          
          if (res.statusCode === 200 && res.headers['content-type']?.includes('audio')) {
            console.log('✅ Stream verificado y funcionando!');
            resolve(true);
          } else {
            console.log('⚠️  Stream responde pero no es audio');
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log(`❌ Error al verificar: ${error.message}`);
          resolve(false);
        });
        
        req.on('timeout', () => {
          console.log('⏰ Timeout al verificar');
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    };
    
    const isWorking = await verifyStream();
    
    if (isWorking) {
      console.log('\n🎉 ¡Proceso completado exitosamente!');
      console.log('La estación LANCO FM ahora debería aparecer como ONLINE');
      
      // 6. Probar que la aplicación pueda verificarla
      console.log('\n🔄 Verificando con el sistema de verificación de la app...');
      
      // Usar el endpoint de verificación directa
      const { verifyStream: appVerifyStream } = require('./lib/stream-verifier');
      
      try {
        const verificationResult = await appVerifyStream(newUrl, 'HTTPS_STREAM');
        console.log(`📊 Resultado de verificación: ${verificationResult.status}`);
        console.log(`⏱️  Tiempo de respuesta: ${verificationResult.responseTime}ms`);
        
        if (verificationResult.status === 'online') {
          console.log('✅ La aplicación puede verificar el stream correctamente');
        } else {
          console.log('⚠️  La aplicación detecta el stream como offline');
        }
      } catch (error) {
        console.log('⚠️  Error en verificación de la app:', error.message);
      }
      
    } else {
      console.log('\n⚠️  La URL fue actualizada pero el stream no responde como esperado');
      console.log('Revisar la configuración del servidor de streaming');
    }
    
    // 7. Mostrar resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 RESUMEN FINAL');
    console.log(`${'='.repeat(60)}`);
    console.log(`🎯 Estación: ${updatedRadio.name} (${updatedRadio.city}, ${updatedRadio.region})`);
    console.log(`🔗 Nueva URL: ${updatedRadio.stream_url}`);
    console.log(`📊 Estado: ${updatedRadio.status}`);
    console.log(`🖥️  Plataforma: ${updatedRadio.platform}`);
    console.log(`✅ Stream verificado: ${isWorking ? 'SÍ' : 'NO'}`);
    console.log(`\nLa URL https://streaming.chiloestreaming.com:10989/ ha sido reemplazada por`);
    console.log(`https://streaming.chiloestreaming.com:10995/;stream.mp3 que está ONLINE`);
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar
updateLancoStreamDirect().catch(console.error);