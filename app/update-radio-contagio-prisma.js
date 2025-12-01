// Usar Prisma desde el archivo de configuración del proyecto
const { prisma } = require('./lib/db.ts');

async function actualizarRadioContagio() {
    console.log('🎵 Actualizando URL de Radio Contagio');
    console.log('='.repeat(50));
    
    try {
        // Buscar Radio Contagio en la base de datos
        console.log('🔍 Buscando Radio Contagio en la base de datos...');
        
        const radio = await prisma.radios.findFirst({
            where: {
                name: {
                    contains: 'contagio',
                    mode: 'insensitive'
                }
            }
        });
            
        if (!radio) {
            console.log('❌ Radio Contagio no encontrada en la base de datos');
            
            // Buscar por URL que contenga sonic.streamingchilenos.com:7113
            console.log('🔍 Buscando por URL que contenga sonic.streamingchilenos.com:7113...');
            
            const radioPorUrl = await prisma.radios.findFirst({
                where: {
                    stream_url: {
                        contains: 'sonic.streamingchilenos.com:7113'
                    }
                }
            });
                
            if (!radioPorUrl) {
                console.log('❌ No se encontraron radios con la URL de sonic.streamingchilenos.com:7113');
                return;
            }
            
            console.log(`📻 Radio encontrada: ${radioPorUrl.name}`);
            console.log(`🌐 URL actual: ${radioPorUrl.stream_url}`);
            console.log(`📍 Región: ${radioPorUrl.region}`);
            
            await actualizarRadio(radioPorUrl);
            
        } else {
            console.log(`📻 Radio encontrada: ${radio.name}`);
            console.log(`🌐 URL actual: ${radio.stream_url}`);
            console.log(`📍 Región: ${radio.region}`);
            
            await actualizarRadio(radio);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function actualizarRadio(radio) {
    // Nueva URL encontrada
    const nuevaUrl = 'https://sonic.streamingchilenos.com:7114/';
    
    if (radio.stream_url === nuevaUrl) {
        console.log('✅ La URL ya está actualizada');
        return;
    }
    
    // Actualizar la URL
    console.log(`🔄 Actualizando URL a: ${nuevaUrl}`);
    
    const updatedRadio = await prisma.radios.update({
        where: {
            id: radio.id
        },
        data: {
            stream_url: nuevaUrl,
            updated_at: new Date()
        }
    });
    
    console.log('✅ URL actualizada exitosamente');
    console.log(`📊 Registro actualizado: ${updatedRadio.name}`);
    console.log(`🌐 Nueva URL: ${updatedRadio.stream_url}`);
    
    // Verificar el stream después de actualizar
    console.log('\n🔍 Verificando el nuevo stream...');
    await verificarStream(nuevaUrl);
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