const { verifyStreamStatus } = require('./lib/stream-verifier');

async function testQuieroVerifier() {
    const url = 'https://streaming-secure.conectaapp.cl/fmquiero.cl?token=f2dbfd16fa2ed744b3039c1f8df4986d5682498b74e00ef19d59391d41cfc5fa';
    
    console.log('🧪 Probando verificador directo con FM Quiero...');
    console.log('URL:', url);
    console.log('');
    
    try {
        const result = await verifyStreamStatus(url);
        
        console.log('✅ Resultado de verificación:');
        console.log('- Status:', result.status);
        console.log('- Details:', result.details);
        console.log('- Stream Type:', result.streamType);
        console.log('- HTTP Status:', result.httpStatus);
        console.log('- Content Type:', result.contentType);
        console.log('- Method:', result.method);
        console.log('- Cloudflare Protected:', result.cloudflareProtected);
        console.log('- Cloudflare Ray:', result.cloudflareRay);
        console.log('- SSL Error:', result.sslError);
        console.log('- SSL Error Fixed:', result.sslErrorFixed);
        
        if (result.status === 'ONLINE') {
            console.log('\n🎉 ¡FM Quiero debería estar ONLINE según el verificador!');
        } else {
            console.log('\n❌ El verificador marca OFFLINE - esto indica un problema');
        }
        
    } catch (error) {
        console.log('❌ Error en verificación:', error.message);
    }
}

testQuieroVerifier().catch(console.error);