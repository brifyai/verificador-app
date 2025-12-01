#!/usr/bin/env node

// Script simple para actualizar LANCO FM con la nueva URL

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
        
        // Actualizar la radio - solo campos básicos
        console.log(`\n🔄 Actualizando ${lancoFM.name}...`);
        
        // Usar el cliente HTTP directo para actualizar
        const updateData = {
          stream_url: newUrl,
          status: 'ACTIVE'
        };
        
        console.log('📤 Enviando actualización...');
        console.log('Datos:', JSON.stringify(updateData, null, 2));
        
        // Actualizar usando el método directo
        const response = await supabaseDirect.updateRadio(lancoFM.id, updateData);
        
        if (response) {
          console.log('✅ Radio actualizada exitosamente');
          console.log(`   ✅ Nueva URL: ${newUrl}`);
          console.log(`   ✅ Estado: ACTIVE`);
          
          // Verificar la actualización
          console.log(`\n🔍 Verificando actualización...`);
          const updatedRadio = await supabaseDirect.getRadioById(lancoFM.id);
          
          if (updatedRadio && updatedRadio.stream_url === newUrl) {
            console.log('✅ Actualización confirmada en la base de datos');
            console.log(`🎉 ¡LANCO FM ahora está online con la nueva URL!`);
            
            // Verificar que el stream esté funcionando
            await verifyStreamStatus(lancoFM.id, newUrl);
            
          } else {
            console.log('⚠️  La actualización podría no haberse aplicado correctamente');
            console.log('URL actual:', updatedRadio?.stream_url);
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

// Función para verificar el estado del stream
async function verifyStreamStatus(radioId, url) {
  console.log(`\n🔍 Verificando estado del stream...`);
  
  try {
    // Hacer una verificación rápida del stream
    const https = require('https');
    const { URL } = require('url');
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Icy-MetaData': '1' // Solicitar metadata del stream
      }
    };
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let metadata = '';
        
        res.on('data', (chunk) => {
          // Solo necesitamos los primeros bytes para verificar que es audio
          if (chunk.length > 0) {
            metadata = 'audio_stream';
            res.destroy(); // Cerrar conexión
          }
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            hasMetadata: !!res.headers['icy-metaint'],
            isAudioStream: metadata === 'audio_stream'
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
    });
    
    console.log(`✅ Stream verificado:`);
    console.log(`   📊 Status HTTP: ${result.status}`);
    console.log(`   🎵 Es stream de audio: ${result.isAudioStream ? 'Sí' : 'No'}`);
    console.log(`   📻 Tiene metadata: ${result.hasMetadata ? 'Sí' : 'No'}`);
    
    if (result.status === 200 && result.isAudioStream) {
      console.log(`🎉 ¡El stream está funcionando perfectamente!`);
      console.log(`✅ LANCO FM ahora está ONLINE y GRABABLE`);
      
      // Mostrar información del servidor
      if (result.headers.server) {
        console.log(`   🖥️  Servidor: ${result.headers.server}`);
      }
      if (result.headers['content-type']) {
        console.log(`   🎵 Tipo de contenido: ${result.headers['content-type']}`);
      }
      
    } else {
      console.log(`⚠️  El stream podría tener problemas`);
    }
    
  } catch (error) {
    console.log(`⚠️  Error verificando stream: ${error.message}`);
    console.log(`ℹ️  Esto podría ser normal dependiendo de la configuración del servidor`);
  }
}

// Ejecutar
updateLancoFM().catch(console.error);