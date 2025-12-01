// Importar el verificador mejorado actualizado
const { verifyStreamEnhanced } = require('./lib/stream-verifier-enhanced.ts');

async function testSomosVerifier() {
    console.log('🧪 Probando verificación de Radio Somos con el verificador actualizado...\n');
    
    const url = 'https://streaming1.tecnoera.com:8227/';
    
    console.log(`📡 URL: ${url}`);
    
    try {
        // Verificar el stream
        console.log('🔄 Verificando stream...');
        const result = await verifyStreamEnhanced(url);
        
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
            console.log('✅ El verificador actualizado detecta correctamente los streams TECNOERA');
        } else {
            console.log(`\n⚠️  Radio Somos está ${result.status}`);
            if (result.error) {
                console.log(`   Detalles: ${result.error}`);
            }
        }
        
    } catch (error) {
        console.log(`\n❌ Error en verificación: ${error.message}`);
        console.log('🔍 Esto puede deberse a que el archivo aún no se ha compilado o hay errores de sintaxis');
    }
}

// Ejecutar prueba
testSomosVerifier().catch(console.error);