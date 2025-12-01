const fs = require('fs');
const path = require('path');

// Leer el token del archivo
const tokenFile = path.join(__dirname, 'admin-token.txt');
let TOKEN;

try {
    TOKEN = fs.readFileSync(tokenFile, 'utf8').trim();
    console.log('✅ Token cargado:', TOKEN.substring(0, 50) + '...');
} catch (error) {
    console.error('❌ Error al leer el token:', error.message);
    process.exit(1);
}

// Función para hacer peticiones con el token en cookie
async function searchRadioPilmaiquen() {
    console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
    console.log('========================================\n');

    let offset = 0;
    const limit = 50;
    let totalProcessed = 0;
    let found = false;

    while (!found) {
        console.log(`📄 Buscando en página ${Math.floor(offset / limit) + 1} (offset: ${offset})...`);
        
        try {
            // Hacer petición usando cookie en lugar de header
            const response = await fetch(`http://localhost:3000/api/radios-direct?limit=${limit}&offset=${offset}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `auth-token=${TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.radios || data.radios.length === 0) {
                console.log('📊 No hay más radios para procesar');
                break;
            }

            // Buscar Radio Pilmaiquen en esta página
            for (const radio of data.radios) {
                totalProcessed++;
                
                // Búsqueda insensible a mayúsculas/minúsculas
                if (radio.name && radio.name.toLowerCase().includes('pilmaiquen')) {
                    console.log('\n🎉 ¡RADIO ENCONTRADA!');
                    console.log('═══════════════════════════════════════');
                    console.log(`📻 Nombre: ${radio.name}`);
                    console.log(`🆔 ID: ${radio.id}`);
                    console.log(`🌐 URL: ${radio.stream_url}`);
                    console.log(`📍 Región: ${radio.region}`);
                    console.log(`📊 Estado: ${radio.status}`);
                    console.log('═══════════════════════════════════════\n');
                    
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log(`   Encontradas ${data.radios.length} radios en esta página`);
                offset += limit;
                
                // Pequeña pausa para no sobrecargar el servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error) {
            console.error(`❌ Error en la petición: ${error.message}`);
            console.log(`📊 Total de radios procesadas antes del error: ${totalProcessed}`);
            break;
        }
    }

    if (!found) {
        console.log(`\n❌ Radio Pilmaiquen no encontrada después de procesar ${totalProcessed} radios`);
    }

    console.log('\n✅ Búsqueda completada');
}

// Ejecutar la búsqueda
searchRadioPilmaiquen().catch(error => {
    console.error('❌ Error durante la búsqueda:', error);
    process.exit(1);
});