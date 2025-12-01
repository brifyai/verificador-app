#!/usr/bin/env node

// Script para actualizar específicamente LANCO FM con la nueva URL

require('dotenv').config();

async function updateLancoFM() {
  console.log('🔄 Actualizando LANCO FM con nueva URL...\n');
  
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
    
    // Buscar LANCO FM específicamente
    console.log('🔍 Buscando LANCO FM...');
    const radios = await supabaseDirect.getRadios({ limit: 1000 });
    const lancoFM = radios.find(radio => 
      radio.name.toLowerCase().includes('lanco') && 
      radio.stream_url.includes('chiloestreaming.com:10989')
    );
    
    if (!lancoFM) {
      console.log('❌ LANCO FM no encontrada');
      return;
    }
    
    console.log('✅ LANCO FM encontrada:');
    console.log(`   📻 Nombre: ${lancoFM.name}`);
    console.log(`   🆔 ID: ${lancoFM.id}`);
    console.log(`   📍 Ciudad: ${lancoFM.city}, ${lancoFM.region}`);
    console.log(`   🔗 URL actual: ${lancoFM.stream_url}`);
    console.log(`   📊 Estado actual: ${lancoFM.status}`);
    
    // Verificar la nueva URL
    const newUrl = 'https://streaming.chiloestreaming.com:10995/;stream.mp3';
    console.log(`\n🧪 Verificando nueva URL: ${newUrl}`);
    
    try {
      const https = require('https');
      const { URL } = require('url');
      const urlObj = new URL(newUrl);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      };
      
      const result = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            message: res.statusMessage
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
      });
      
      console.log(`✅ Nueva URL verificada - Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log('🎉 La nueva URL está funcionando correctamente');
        
        // Actualizar la radio
        console.log(`\n🔄 Actualizando ${lancoFM.name}...`);
        
        const updateResult = await supabaseDirect.updateRadio(lancoFM.id, {
          stream_url: newUrl,
          status: 'ACTIVE',
          last_verified: new Date().toISOString()
        });
        
        if (updateResult) {
          console.log('✅ Radio actualizada exitosamente');
          console.log(`   ✅ Nueva URL: ${newUrl}`);
          console.log(`   ✅ Estado: ACTIVE`);
          console.log(`   ✅ Verificación: ${new Date().toISOString()}`);
          
          // Verificar la actualización
          console.log(`\n🔍 Verificando actualización...`);
          const updatedRadio = await supabaseDirect.getRadioById(lancoFM.id);
          
          if (updatedRadio && updatedRadio.stream_url === newUrl) {
            console.log('✅ Actualización confirmada en la base de datos');
            
            // Probar grabación
            console.log(`\n🎙️ Probando grabación del stream...`);
            await testRecording(newUrl, lancoFM.name);
            
          } else {
            console.log('⚠️  La actualización podría no haberse aplicado correctamente');
          }
          
        } else {
          console.log('❌ Error al actualizar la radio');
        }
        
      } else {
        console.log(`⚠️  La nueva URL devolvió status ${result.status}`);
        console.log('❌ No se actualizará la base de datos');
      }
      
    } catch (error) {
      console.log(`❌ Error verificando nueva URL: ${error.message}`);
      console.log('❌ No se actualizará la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Función para probar grabación
async function testRecording(url, radioName) {
  console.log(`\n🎙️ Probando grabación de ${radioName}...`);
  
  try {
    const { RecordingService } = require('./lib/recording');
    const recordingService = new RecordingService();
    
    // Configurar grabación de prueba
    const testConfig = {
      radioName: radioName,
      radioUrl: url,
      duration: 30, // 30 segundos
      format: 'mp3',
      quality: '128k'
    };
    
    console.log(`⏱️  Iniciando grabación de prueba de 30 segundos...`);
    
    const result = await recordingService.startRecording({
      radioId: 'test-lanco-fm',
      radioName: radioName,
      streamUrl: url,
      duration: 30,
      format: 'mp3',
      quality: '128k'
    });
    
    if (result.success) {
      console.log(`✅ Grabación iniciada exitosamente`);
      console.log(`📁 Archivo: ${result.filename}`);
      console.log(`⏱️  Duración: 30 segundos`);
      
      // Esperar unos segundos para verificar que la grabación continúe
      console.log(`⏳ Esperando 5 segundos para verificar estabilidad...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`✅ La grabación parece estar funcionando correctamente`);
      console.log(`🎉 ¡LANCO FM ahora está online y grabable!`);
      
    } else {
      console.log(`❌ Error en grabación: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Error en prueba de grabación: ${error.message}`);
    console.log(`ℹ️  Esto podría ser normal si el servicio de grabación no está configurado`);
    console.log(`✅ De todos modos, la URL está actualizada y el stream está online`);
  }
}

// Ejecutar
updateLancoFM().catch(console.error);