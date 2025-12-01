const https = require('https');

// Configuración
const API_BASE_URL = 'https://api-verificador.radio.cloudns.org/api/radios-direct';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQHZlcmZpY2Fkb3IuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzMzMDYxNTk5LCJleHAiOjE3MzM2NjYzOTl9.m3zgqK8VziYbMrgFbKq4oBNjV4tVc1bRN_c4rKHs2nI';

// Función para hacer peticiones HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                ...options.headers
            }
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsedData });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

// Función principal para buscar Radio Pilmaiquen
async function buscarRadioPilmaiquen() {
    console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
    console.log('========================================\n');

    let offset = 0;
    const limit = 100; // Mayor límite para procesar más rápido
    let found = false;

    while (!found) {
        try {
            console.log(`📄 Buscando en página ${Math.floor(offset / limit) + 1} (offset: ${offset})...`);
            
            const url = `${API_BASE_URL}?limit=${limit}&offset=${offset}`;
            const response = await makeRequest(url);

            if (response.statusCode !== 200) {
                console.log(`❌ Error en la petición: ${response.statusCode}`);
                break;
            }

            const radios = response.data;
            
            if (!radios || radios.length === 0) {
                console.log('📭 No hay más radios para procesar');
                break;
            }

            console.log(`📊 Procesando ${radios.length} radios...`);

            // Buscar Radio Pilmaiquen
            for (const radio of radios) {
                if (radio.name && radio.name.toLowerCase().includes('pilmaiquen')) {
                    console.log('🎉 ¡RADIO PILMAIQUEN ENCONTRADA!');
                    console.log('=====================================');
                    console.log(`📻 Nombre: ${radio.name}`);
                    console.log(`🆔 ID: ${radio.id}`);
                    console.log(`🌐 URL: ${radio.stream_url}`);
                    console.log(`📍 Región: ${radio.region}`);
                    console.log(`📊 Estado: ${radio.status}`);
                    console.log(`🏷️  Etiquetas: ${radio.tags || 'N/A'}`);
                    console.log('=====================================\n');
                    
                    found = true;
                    break;
                }
            }

            if (!found) {
                offset += limit;
                // Pequeña pausa para no sobrecargar el servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error) {
            console.log(`❌ Error procesando página: ${error.message}`);
            break;
        }
    }

    if (!found) {
        console.log('❌ Radio Pilmaiquen no encontrada después de procesar muchas páginas');
    }

    console.log('✅ Búsqueda completada');
}

// Ejecutar la búsqueda
buscarRadioPilmaiquen().catch(console.error);