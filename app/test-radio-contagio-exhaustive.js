const https = require('https');
const http = require('http');

// Configuración
const RADIO_NAME = "Radio Contagio";
const HOST = "sonic.streamingchilenos.com";
const TIMEOUT = 10000;

// Diferentes puertos comunes de SonicPanel
const PUERTOS = [7113, 7114, 7115, 7116, 7117, 7118, 7119, 7120, 7121, 7122, 7123, 7124, 7125];

// Diferentes rutas comunes
const RUTAS = [
    '/',
    '/stream',
    '/;stream.mp3',
    '/listen',
    '/listen.pls',
    '/listen.m3u',
    '/listen.asx',
    '/listen.qtl',
    '/listen.ram',
    '/stream.pls',
    '/stream.m3u',
    '/stream.asx',
    '/stream.qtl',
    '/stream.ram',
    '/radio',
    '/radio/',
    '/radio/stream',
    '/radio/;stream.mp3',
    '/live',
    '/live/',
    '/live/stream',
    '/live/;stream.mp3',
    '/mp3',
    '/mp3/',
    '/mp3/stream',
    '/mp3/;stream.mp3',
    '/aac',
    '/aac/',
    '/aac/stream',
    '/aac/;stream.mp3'
];

// Headers para simular reproductores de audio
const AUDIO_HEADERS = {
    'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
    'Accept': 'audio/mpeg, audio/*',
    'Icy-MetaData': '1',
    'Range': 'bytes=0-',
    'Connection': 'close'
};

function verificarEndpoint(protocolo, puerto, ruta) {
    return new Promise((resolve) => {
        const url = `${protocolo}://${HOST}:${puerto}${ruta}`;
        console.log(`📡 Probando: ${url}`);
        
        const options = {
            hostname: HOST,
            port: puerto,
            path: ruta,
            method: 'HEAD',
            headers: AUDIO_HEADERS,
            timeout: TIMEOUT,
            rejectUnauthorized: false // Aceptar certificados autofirmados
        };

        const req = (protocolo === 'https' ? https : http).request(options, (res) => {
            const status = res.statusCode;
            const headers = res.headers;
            
            console.log(`   ✅ Estado: ${status} ${res.statusMessage}`);
            
            // Verificar si es un stream de audio válido
            const contentType = headers['content-type'] || '';
            const icyName = headers['icy-name'];
            const icyGenre = headers['icy-genre'];
            const icyBr = headers['icy-br'];
            
            if (status === 200 && (contentType.includes('audio') || contentType.includes('mpeg') || icyName)) {
                console.log(`   🎵 ¡STREAM ENCONTRADO!`);
                console.log(`   📻 Nombre: ${icyName || 'No especificado'}`);
                console.log(`   🎼 Género: ${icyGenre || 'No especificado'}`);
                console.log(`   📊 Bitrate: ${icyBr || 'No especificado'}`);
                console.log(`   📋 Tipo: ${contentType}`);
                resolve({ url, status, headers, found: true });
            } else {
                resolve({ url, status, headers, found: false });
            }
        });

        req.on('error', (error) => {
            console.log(`   ❌ Error: ${error.message}`);
            resolve({ url, status: 0, error: error.message, found: false });
        });

        req.on('timeout', () => {
            console.log(`   ⏰ Timeout`);
            req.destroy();
            resolve({ url, status: 0, error: 'timeout', found: false });
        });

        req.end();
    });
}

async function buscarStream() {
    console.log(`🔍 Búsqueda exhaustiva de ${RADIO_NAME}`);
    console.log(`🌐 Dominio: ${HOST}`);
    console.log(`📊 Puertos a probar: ${PUERTOS.length}`);
    console.log(`📁 Rutas a probar: ${RUTAS.length}`);
    console.log('='.repeat(60));
    
    const resultados = [];
    let encontrado = false;
    
    for (const puerto of PUERTOS) {
        console.log(`\n🔍 Probando puerto ${puerto}...`);
        
        for (const ruta of RUTAS) {
            // Probar HTTPS primero
            const resultadoHttps = await verificarEndpoint('https', puerto, ruta);
            resultados.push(resultadoHttps);
            
            if (resultadoHttps.found) {
                encontrado = true;
                console.log(`\n🎉 ¡STREAM ENCONTRADO EN HTTPS!`);
                console.log(`📡 URL: ${resultadoHttps.url}`);
                break;
            }
            
            // Si HTTPS falla, probar HTTP
            if (resultadoHttps.status === 0 || resultadoHttps.status >= 400) {
                const resultadoHttp = await verificarEndpoint('http', puerto, ruta);
                resultados.push(resultadoHttp);
                
                if (resultadoHttp.found) {
                    encontrado = true;
                    console.log(`\n🎉 ¡STREAM ENCONTRADO EN HTTP!`);
                    console.log(`📡 URL: ${resultadoHttp.url}`);
                    break;
                }
            }
            
            if (encontrado) break;
        }
        
        if (encontrado) break;
        
        // Pequeña pausa entre puertos para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE BÚSQUEDA');
    console.log('='.repeat(60));
    
    if (encontrado) {
        const streamEncontrado = resultados.find(r => r.found);
        console.log(`🎵 ¡STREAM ENCONTRADO!`);
        console.log(`📡 URL: ${streamEncontrado.url}`);
        console.log(`📊 Estado: ${streamEncontrado.status}`);
        console.log(`📋 Headers:`, streamEncontrado.headers);
    } else {
        console.log(`❌ No se encontró stream activo`);
        console.log(`📊 Total de endpoints probados: ${resultados.length}`);
        
        // Mostrar los mejores resultados (status 200)
        const exitosos = resultados.filter(r => r.status === 200 && !r.found);
        if (exitosos.length > 0) {
            console.log(`\n📋 Endpoints con status 200 (pero no son streams):`);
            exitosos.slice(0, 5).forEach(r => {
                console.log(`   - ${r.url} (${r.headers['content-type'] || 'sin content-type'})`);
            });
        }
    }
    
    return encontrado;
}

// Ejecutar búsqueda
buscarStream().then(encontrado => {
    process.exit(encontrado ? 0 : 1);
}).catch(error => {
    console.error('❌ Error en la búsqueda:', error);
    process.exit(1);
});