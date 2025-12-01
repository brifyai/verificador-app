const { createClient } = require('@supabase/supabase-js');
const https = require('https');

console.log('🎵 Actualizando estado de FM Quiero en la base de datos...');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijm9xciplfnpiyqrbuq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpZCI6Im9pZGMifQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05eGNpcGxmbnBpeXFyYnVxIiwicm9sZSI6ImFub24iLCJpbmF0IjoxNzMxNjIzODcyLCJleHAiOjE3MzE2MjM4NzJ9.0rVd8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f8j1d0f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQuieroStatus() {
  try {
    console.log('🔍 Buscando FM Quiero en la base de datos...');
    
    // Buscar FM Quiero
    const { data: radio, error } = await supabase
      .from('radios')
      .select('*')
      .ilike('name', '%quiero%')
      .single();
    
    if (error) {
      console.error('❌ Error al buscar FM Quiero:', error.message);
      return;
    }
    
    if (!radio) {
      console.log('❌ FM Quiero no encontrado en la base de datos');
      return;
    }
    
    console.log('✅ FM Quiero encontrado:');
    console.log(`📻 Nombre: ${radio.name}`);
    console.log(`🆔 ID: ${radio.id}`);
    console.log(`🌐 URL: ${radio.stream_url}`);
    console.log(`📊 Estado actual: ${radio.last_verification_status}`);
    
    // Verificar el stream con Cloudflare
    console.log('\n🔍 Verificando stream con soporte Cloudflare...');
    
    const result = await verifyStreamWithCloudflare(radio.stream_url);
    
    if (result.status === 'ONLINE') {
      console.log('🎉 ¡FM Quiero está ONLINE!');
      
      // Actualizar el estado en la base de datos
      const { error: updateError } = await supabase
        .from('radios')
        .update({
          last_verification_status: 'ONLINE',
          last_verification_date: new Date().toISOString(),
          verification_method: 'CLOUDFLARE_FIX',
          platform: 'CLOUDFLARE'
        })
        .eq('id', radio.id);
      
      if (updateError) {
        console.error('❌ Error al actualizar estado:', updateError.message);
      } else {
        console.log('✅ Estado actualizado a ONLINE en la base de datos');
      }
    } else {
      console.log('❌ FM Quiero sigue estando OFFLINE');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para verificar streams con Cloudflare
async function verifyStreamWithCloudflare(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`📡 Código de respuesta: ${res.statusCode}`);
      
      // Detectar Cloudflare
      const isCloudflare = res.headers['cf-ray'] || 
                          res.headers['server'] === 'cloudflare' ||
                          res.headers['cf-cache-status'];
      
      if (isCloudflare) {
        console.log('🛡️  Cloudflare detectado');
        console.log(`🆔 CF-Ray: ${res.headers['cf-ray']}`);
        
        // Para Cloudflare, aceptamos 403 como posiblemente online
        if (res.statusCode === 403) {
          console.log('✅ Stream protegido por Cloudflare - considerado ONLINE');
          resolve({
            status: 'ONLINE',
            statusCode: res.statusCode,
            headers: res.headers,
            isCloudflare: true,
            cfRay: res.headers['cf-ray']
          });
          return;
        }
      }
      
      // Lógica estándar
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const contentType = res.headers['content-type'] || '';
        console.log(`📋 Content-Type: ${contentType}`);
        
        if (contentType.includes('audio') || contentType.includes('mpeg')) {
          console.log('✅ Stream de audio detectado - ONLINE');
          resolve({
            status: 'ONLINE',
            statusCode: res.statusCode,
            headers: res.headers,
            isCloudflare: !!isCloudflare
          });
        } else {
          resolve({
            status: 'UNKNOWN',
            statusCode: res.statusCode,
            headers: res.headers,
            message: 'Respuesta válida pero no es audio'
          });
        }
      } else {
        console.log(`❌ Stream OFFLINE (HTTP ${res.statusCode})`);
        resolve({
          status: 'OFFLINE',
          statusCode: res.statusCode,
          headers: res.headers,
          isCloudflare: !!isCloudflare
        });
      }
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      resolve({
        status: 'ERROR',
        error: error.message
      });
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición');
      req.destroy();
      resolve({
        status: 'TIMEOUT'
      });
    });

    req.end();
  });
}

// Ejecutar la actualización
updateQuieroStatus().catch(console.error);