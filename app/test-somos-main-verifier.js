// Usar el verificador principal actualizado
const { verifyStream } = require('./lib/stream-verifier.ts');

async function testSomosMainVerifier() {
    console.log('🧪 Probando verificación de Radio Somos con el verificador principal actualizado...\n');
    
    const url = 'https://streaming1.tecnoera.com:8227/';
    
    console.log(`📡 URL: ${url}`);
    
    try {
        // Verificar el stream
        console.log('🔄 Verificando stream...');
        const result = await verifyStream(url);
        
        console.log('\n📊 Resultado de verificación:');
        console.log(`   URL: ${result.url}`);
        console.log(`   Estado: ${result.status}`);
        console.log(`   Tipo: ${result.type}`);
        console.log(`   Tiempo de respuesta: ${result.responseTime}ms`);
        
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        
        if (result.status === 'ONLINE') {
            console.log('\n🎉 ¡Radio Somos verificada como ONLINE!');
            console.log('✅ El verificador principal detecta correctamente los streams TECNOERA');
        } else {
            console.log(`\n⚠️  Radio Somos está ${result.status}`);
            if (result.error) {
                console.log(`   Detalles: ${result.error}`);
            }
        }
        
    } catch (error) {
        console.log(`\n❌ Error en verificación: ${error.message}`);
        console.log('🔍 Esto puede deberse a que el archivo aún no se ha compilado o hay errores de sintaxis');
        
        // Intentar con una verificación directa
        console.log('\n🔄 Intentando verificación directa...');
        await testDirectVerification();
    }
}

// Verificación directa usando la lógica del verificador
async function testDirectVerification() {
    const https = require('https');
    const url = 'https://streaming1.tecnoera.com:8227/';
    
    console.log(`📡 Verificación directa de: ${url}`);
    
    try {
        const result = await new Promise((resolve) => {
            const options = {
                method: 'HEAD',
                timeout: 10000,
                rejectUnauthorized: false
            };
            
            const req = https.request(url, options, (res) => {
                console.log(`📊 Código de respuesta: ${res.statusCode}`);
                console.log(`📋 Content-Type: ${res.headers['content-type']}`);
                console.log(`📻 Server: ${res.headers['server']}`);
                console.log(`🎵 Audio Info: ${res.headers['icy-name'] || 'No disponible'}`);
                
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const contentType = res.headers['content-type'] || '';
                    if (contentType.includes('audio') || contentType.includes('application/octet-stream')) {
                        resolve({
                            status: 'ONLINE',
                            type: 'TECNOERA',
                            responseTime: Date.now() - startTime,
                            url: url
                        });
                    } else {
                        resolve({
                            status: 'UNKNOWN',
                            type: 'TECNOERA',
                            responseTime: Date.now() - startTime,
                            url: url,
                            error: 'No audio content type'
                        });
                    }
                } else {
                    resolve({
                        status: 'OFFLINE',
                        type: 'TECNOERA',
                        responseTime: Date.now() - startTime,
                        url: url,
                        error: `HTTP ${res.statusCode}`
                    });
                }
            });
            
            const startTime = Date.now();
            
            req.on('error', (err) => {
                console.log(`❌ Error: ${err.message}`);
                resolve({
                    status: 'ERROR',
                    type: 'TECNOERA',
                    responseTime: Date.now() - startTime,
                    url: url,
                    error: err.message
                });
            });
            
            req.on('timeout', () => {
                console.log('⏰ Timeout');
                req.destroy();
                resolve({
                    status: 'TIMEOUT',
                    type: 'TECNOERA',
                    responseTime: Date.now() - startTime,
                    url: url,
                    error: 'Request timeout'
                });
            });
            
            req.end();
        });
        
        console.log('\n📊 Resultado de verificación directa:');
        console.log(`   Estado: ${result.status}`);
        console.log(`   Tipo: ${result.type}`);
        console.log(`   Tiempo: ${result.responseTime}ms`);
        
        if (result.status === 'ONLINE') {
            console.log('\n🎉 ¡Radio Somos verificada como ONLINE con verificación directa!');
        } else {
            console.log(`\n⚠️  Radio Somos está ${result.status}`);
            if (result.error) {
                console.log(`   Detalles: ${result.error}`);
            }
        }
        
    } catch (error) {
        console.log(`\n❌ Error en verificación directa: ${error.message}`);
    }
}

// Ejecutar prueba
testSomosMainVerifier().catch(console.error);