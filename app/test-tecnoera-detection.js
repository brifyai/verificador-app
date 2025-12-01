const https = require('https');

// Función para detectar el tipo de stream (simplificada)
function detectStreamType(url) {
    if (url.includes('zeno.fm')) return 'ZENO';
    if (url.includes('tunzilla.com')) return 'TUNZILLA';
    if (url.includes('tecnoera.com')) return 'TECNOERA';
    if (url.includes('cloudflare') || url.includes('conectaapp.cl')) return 'CLOUDFLARE';
    if (url.includes('icecast')) return 'ICECAST';
    if (url.includes('shoutcast')) return 'SHOUTCAST';
    return 'DIRECT';
}

// Función para verificar stream TECNOERA
async function verifyTecnoeraStream(url) {
    console.log(`🔍 Verificando stream TECNOERA: ${url}`);
    
    try {
        // Intentar HEAD request primero
        const headResult = await new Promise((resolve) => {
            const options = {
                method: 'HEAD',
                timeout: 5000,
                rejectUnauthorized: false
            };
            
            const req = https.request(url, options, (res) => {
                console.log(`📊 HEAD Response: ${res.statusCode}`);
                console.log(`📋 Content-Type: ${res.headers['content-type']}`);
                
                // Aceptar varios códigos de éxito para TECNOERA
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const contentType = res.headers['content-type'] || '';
                    if (contentType.includes('audio') || contentType.includes('application/octet-stream')) {
                        resolve({ status: 'ONLINE', method: 'HEAD' });
                    } else {
                        resolve({ status: 'UNKNOWN', method: 'HEAD', reason: 'No audio content type' });
                    }
                } else {
                    resolve({ status: 'OFFLINE', method: 'HEAD', reason: `HTTP ${res.statusCode}` });
                }
            });
            
            req.on('error', (err) => {
                console.log(`❌ HEAD Error: ${err.message}`);
                resolve({ status: 'ERROR', method: 'HEAD', error: err.message });
            });
            
            req.on('timeout', () => {
                console.log('⏰ HEAD Timeout');
                req.destroy();
                resolve({ status: 'TIMEOUT', method: 'HEAD' });
            });
            
            req.end();
        });
        
        // Si HEAD funciona, retornar resultado
        if (headResult.status === 'ONLINE') {
            return headResult;
        }
        
        // Si HEAD falla, intentar RANGE request
        console.log('🔄 Intentando RANGE request...');
        
        const rangeResult = await new Promise((resolve) => {
            const options = {
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1'
                },
                timeout: 10000,
                rejectUnauthorized: false
            };
            
            const req = https.request(url, options, (res) => {
                console.log(`📊 RANGE Response: ${res.statusCode}`);
                console.log(`📋 Content-Type: ${res.headers['content-type']}`);
                
                // Aceptar 206 (Partial Content) o 200 (OK)
                if (res.statusCode === 206 || res.statusCode === 200) {
                    const contentType = res.headers['content-type'] || '';
                    if (contentType.includes('audio') || contentType.includes('application/octet-stream')) {
                        resolve({ status: 'ONLINE', method: 'RANGE' });
                    } else {
                        resolve({ status: 'UNKNOWN', method: 'RANGE', reason: 'No audio content type' });
                    }
                } else {
                    resolve({ status: 'OFFLINE', method: 'RANGE', reason: `HTTP ${res.statusCode}` });
                }
            });
            
            req.on('error', (err) => {
                console.log(`❌ RANGE Error: ${err.message}`);
                resolve({ status: 'ERROR', method: 'RANGE', error: err.message });
            });
            
            req.on('timeout', () => {
                console.log('⏰ RANGE Timeout');
                req.destroy();
                resolve({ status: 'TIMEOUT', method: 'RANGE' });
            });
            
            req.end();
        });
        
        return rangeResult;
        
    } catch (error) {
        console.log(`❌ Error general: ${error.message}`);
        return { status: 'ERROR', error: error.message };
    }
}

// Función principal de prueba
async function testTecnoeraDetection() {
    console.log('🧪 Probando detección y verificación de TECNOERA...\n');
    
    const url = 'https://streaming1.tecnoera.com:8227/';
    
    console.log(`📡 URL de prueba: ${url}`);
    
    // Detectar tipo
    const streamType = detectStreamType(url);
    console.log(`🔍 Tipo detectado: ${streamType}`);
    
    if (streamType === 'TECNOERA') {
        console.log('✅ Detección TECNOERA funcionando correctamente');
        
        // Verificar stream
        console.log('\n🔄 Verificando stream...');
        const result = await verifyTecnoeraStream(url);
        
        console.log('\n📊 Resultado de verificación:');
        console.log(`   Estado: ${result.status}`);
        console.log(`   Método: ${result.method}`);
        if (result.reason) console.log(`   Razón: ${result.reason}`);
        if (result.error) console.log(`   Error: ${result.error}`);
        
        if (result.status === 'ONLINE') {
            console.log('\n🎉 ¡Stream TECNOERA verificado como ONLINE!');
        } else {
            console.log('\n⚠️  Stream TECNOERA está OFFLINE o tiene problemas');
        }
        
    } else {
        console.log(`❌ Detección falló - se detectó como: ${streamType}`);
    }
}

// Ejecutar prueba
testTecnoeraDetection().catch(console.error);