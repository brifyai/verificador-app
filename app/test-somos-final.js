#!/usr/bin/env node

/**
 * Script final para verificar Radio Somos con el verificador actualizado
 */

const { verifyStream } = require('./lib/stream-verifier');

async function testRadioSomosFinal() {
    console.log('🎵 Probando Radio Somos de Petorca con el verificador actualizado...\n');

    const streamUrl = 'https://streaming1.tecnoera.com:8227/';
    
    try {
        console.log(`📡 Verificando: ${streamUrl}`);
        
        const result = await verifyStream(streamUrl);
        
        console.log('\n✅ Resultado de la verificación:');
        console.log(`   - Estado: ${result.status}`);
        console.log(`   - Plataforma: ${result.platform}`);
        console.log(`   - Tipo de stream: ${result.streamType}`);
        console.log(`   - Código HTTP: ${result.statusCode}`);
        console.log(`   - Content-Type: ${result.contentType}`);
        console.log(`   - Tiempo de respuesta: ${result.responseTime}ms`);
        
        if (result.error) {
            console.log(`   - Error: ${result.error}`);
        }
        
        if (result.status === 'ONLINE') {
            console.log('\n🎉 ¡ÉXITO! Radio Somos está ONLINE');
            console.log(`   - Plataforma detectada: ${result.platform}`);
            console.log(`   - Tipo de stream: ${result.streamType}`);
            
            if (result.platform === 'TECNOERA') {
                console.log('✅ La plataforma TECNOERA fue detectada correctamente');
            }
            
        } else {
            console.log(`\n⚠️  Radio Somos está marcada como: ${result.status}`);
        }
        
        // Verificar los headers específicos de Shoutcast
        console.log('\n📡 Análisis de headers:');
        if (result.headers) {
            const headers = result.headers;
            console.log(`   - Server: ${headers.server || 'No especificado'}`);
            console.log(`   - icy-name: ${headers['icy-name'] || 'No especificado'}`);
            console.log(`   - icy-br: ${headers['icy-br'] || 'No especificado'}`);
            console.log(`   - icy-metaint: ${headers['icy-metaint'] || 'No especificado'}`);
            console.log(`   - Content-Type: ${headers['content-type'] || 'No especificado'}`);
            
            if (headers['icy-name']) {
                console.log('✅ Detectado servidor Shoutcast/Icecast');
            }
        }

    } catch (error) {
        console.log('❌ Error al verificar el stream:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Ejecutar
testRadioSomosFinal();