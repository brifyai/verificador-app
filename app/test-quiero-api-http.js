const https = require('https');

async function testQuieroHTTP() {
    const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
    
    console.log('🧪 Probando conexión HTTP a FM Quiero...');
    console.log('URL:', url);
    
    // Test 1: HEAD request básico
    console.log('\n📋 Test 1: HEAD request básico');
    try {
        const options = {
            method: 'HEAD',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const req = https.request(url, options, (res) => {
            console.log('Status:', res.statusCode);
            console.log('Headers:', res.headers);
            
            if (res.headers['cf-ray']) {
                console.log('✅ Cloudflare detectado:', res.headers['cf-ray']);
            }
        });
        
        req.on('error', (err) => {
            console.log('❌ Error HEAD:', err.message);
        });
        
        req.on('timeout', () => {
            console.log('⏰ Timeout HEAD');
            req.destroy();
        });
        
        req.end();
        
        // Esperar a que termine
        await new Promise(resolve => {
            req.on('close', resolve);
            setTimeout(resolve, 11000); // Timeout máximo
        });
        
    } catch (error) {
        console.log('❌ Error en HEAD:', error.message);
    }
    
    // Test 2: GET request con headers de navegador
    console.log('\n📋 Test 2: GET request con headers completos');
    try {
        const options = {
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };
        
        const req = https.request(url, options, (res) => {
            console.log('Status:', res.statusCode);
            console.log('Content-Type:', res.headers['content-type']);
            console.log('Content-Length:', res.headers['content-length']);
            
            if (res.headers['cf-ray']) {
                console.log('✅ Cloudflare detectado:', res.headers['cf-ray']);
            }
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Data length:', data.length);
                if (data.includes('audio/mpeg')) {
                    console.log('✅ Contenido de audio detectado');
                }
            });
        });
        
        req.on('error', (err) => {
            console.log('❌ Error GET:', err.message);
        });
        
        req.on('timeout', () => {
            console.log('⏰ Timeout GET');
            req.destroy();
        });
        
        req.end();
        
        // Esperar a que termine
        await new Promise(resolve => {
            req.on('close', resolve);
            setTimeout(resolve, 16000); // Timeout máximo
        });
        
    } catch (error) {
        console.log('❌ Error en GET:', error.message);
    }
    
    console.log('\n✅ Pruebas HTTP completadas');
}

// Ejecutar
testQuieroHTTP().catch(console.error);