#!/usr/bin/env node

// Script para actualizar la URL de LANCO FM en la base de datos

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase');
  console.log('Requeridas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateLancoStream() {
  console.log('🔄 Actualizando URL de LANCO FM...\n');
  
  try {
    // Primero, verificar la estación actual
    console.log('🔍 Buscando LANCO FM en la base de datos...');
    
    const { data: currentRadio, error: findError } = await supabase
      .from('radios')
      .select('*')
      .eq('name', 'LANCO FM')
      .single();
    
    if (findError) {
      console.error('❌ Error al buscar LANCO FM:', findError.message);
      return;
    }
    
    if (!currentRadio) {
      console.error('❌ LANCO FM no encontrado en la base de datos');
      return;
    }
    
    console.log('📻 Estación encontrada:');
    console.log(`   ID: ${currentRadio.id}`);
    console.log(`   Nombre: ${currentRadio.name}`);
    console.log(`   Ciudad: ${currentRadio.city}`);
    console.log(`   Región: ${currentRadio.region}`);
    console.log(`   URL actual: ${currentRadio.stream_url}`);
    console.log(`   Estado: ${currentRadio.status}`);
    
    // Nueva URL encontrada
    const newUrl = 'https://streaming.chiloestreaming.com:10995/;stream.mp3';
    
    console.log(`\n🔄 Actualizando URL a: ${newUrl}`);
    
    const { data: updatedRadio, error: updateError } = await supabase
      .from('radios')
      .update({
        stream_url: newUrl,
        status: 'ACTIVE', // Forzar estado activo ya que el stream funciona
        updated_at: new Date().toISOString()
      })
      .eq('id', currentRadio.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error al actualizar:', updateError.message);
      return;
    }
    
    console.log('✅ ¡URL actualizada exitosamente!');
    console.log('\n📊 Nuevos datos:');
    console.log(`   URL: ${updatedRadio.stream_url}`);
    console.log(`   Estado: ${updatedRadio.status}`);
    console.log(`   Actualizado: ${updatedRadio.updated_at}`);
    
    // Verificar que el stream funcione
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
    } else {
      console.log('\n⚠️  La URL fue actualizada pero el stream no responde como esperado');
      console.log('Revisar la configuración del servidor de streaming');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar
updateLancoStream().catch(console.error);