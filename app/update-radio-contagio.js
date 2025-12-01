const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no configuradas');
    console.log('Variables requeridas:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function actualizarRadioContagio() {
    console.log('🎵 Actualizando URL de Radio Contagio');
    console.log('='.repeat(50));
    
    try {
        // Buscar Radio Contagio en la base de datos
        console.log('🔍 Buscando Radio Contagio en la base de datos...');
        
        const { data: radio, error: searchError } = await supabase
            .from('radios')
            .select('id, name, stream_url, region')
            .ilike('name', '%contagio%')
            .single();
            
        if (searchError) {
            console.error('❌ Error al buscar Radio Contagio:', searchError);
            return;
        }
        
        if (!radio) {
            console.log('❌ Radio Contagio no encontrada en la base de datos');
            return;
        }
        
        console.log(`📻 Radio encontrada: ${radio.name}`);
        console.log(`🌐 URL actual: ${radio.stream_url}`);
        console.log(`📍 Región: ${radio.region}`);
        
        // Nueva URL encontrada
        const nuevaUrl = 'https://sonic.streamingchilenos.com:7114/';
        
        if (radio.stream_url === nuevaUrl) {
            console.log('✅ La URL ya está actualizada');
            return;
        }
        
        // Actualizar la URL
        console.log(`\n🔄 Actualizando URL a: ${nuevaUrl}`);
        
        const { data: updatedRadio, error: updateError } = await supabase
            .from('radios')
            .update({ 
                stream_url: nuevaUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', radio.id)
            .select();
            
        if (updateError) {
            console.error('❌ Error al actualizar:', updateError);
            return;
        }
        
        console.log('✅ URL actualizada exitosamente');
        console.log(`📊 Registro actualizado: ${updatedRadio[0].name}`);
        console.log(`🌐 Nueva URL: ${updatedRadio[0].stream_url}`);
        
        // Verificar el stream después de actualizar
        console.log('\n🔍 Verificando el nuevo stream...');
        await verificarStream(nuevaUrl);
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

async function verificarStream(url) {
    const https = require('https');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'sonic.streamingchilenos.com',
            port: 7114,
            path: '/',
            method: 'HEAD',
            headers: {
                'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
                'Accept': 'audio/mpeg, audio/*',
                'Icy-MetaData': '1',
                'Range': 'bytes=0-',
                'Connection': 'close'
            },
            timeout: 10000,
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            const status = res.statusCode;
            const headers = res.headers;
            
            if (status === 200) {
                console.log('✅ Stream verificado - está online');
                console.log(`📻 Nombre: ${headers['icy-name'] || 'No especificado'}`);
                console.log(`🎼 Género: ${headers['icy-genre'] || 'No especificado'}`);
                console.log(`📊 Bitrate: ${headers['icy-br'] || 'No especificado'}`);
                console.log(`📋 Tipo: ${headers['content-type'] || 'No especificado'}`);
            } else {
                console.log(`❌ Stream verificado - estado: ${status}`);
            }
            
            resolve();
        });

        req.on('error', (error) => {
            console.log(`❌ Error al verificar: ${error.message}`);
            resolve();
        });

        req.on('timeout', () => {
            console.log('⏰ Timeout al verificar');
            req.destroy();
            resolve();
        });

        req.end();
    });
}

// Ejecutar actualización
actualizarRadioContagio().then(() => {
    console.log('\n✅ Proceso completado');
}).catch(error => {
    console.error('❌ Error en el proceso:', error);
});