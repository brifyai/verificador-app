const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Leer el token del archivo
const tokenFile = path.join(__dirname, 'valid-token.txt');
let authToken;

try {
    authToken = fs.readFileSync(tokenFile, 'utf8').trim();
    console.log('✅ Token cargado:', authToken.substring(0, 50) + '...');
} catch (error) {
    console.error('❌ Error al leer el token:', error.message);
    process.exit(1);
}

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api/radios-direct';
const LIMIT = 50; // Procesar 50 radios por página
const SEARCH_TERM = 'pilmaiquen';

// Función para hacer peticiones HTTP/HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: 10000
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Función para buscar Radio Pilmaiquen
async function searchRadioPilmaiquen() {
    console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
    console.log('========================================\n');

    let offset = 0;
    let totalProcessed = 0;
    let found = false;

    while (!found) {
        console.log(`📄 Buscando en página ${Math.floor(offset / LIMIT) + 1} (offset: ${offset})...`);
        
        try {
            const response = await makeRequest(`${API_BASE_URL}?limit=${LIMIT}&offset=${offset}`);
            
            if (response.statusCode !== 200) {
                console.error(`❌ Error en la petición: ${response.statusCode}`);
                break;
            }

            const radios = response.data;
            
            if (!Array.isArray(radios) || radios.length === 0) {
                console.log('📊 No hay más radios para procesar');
                break;
            }

            // Buscar Radio Pilmaiquen en esta página
            for (const radio of radios) {
                totalProcessed++;
                
                if (radio.name && radio.name.toLowerCase().includes(SEARCH_TERM.toLowerCase())) {
                    console.log('🎉 ¡RADIO ENCONTRADA!');
                    console.log('════════════════════════════════════════');
                    console.log(`📻 Nombre: ${radio.name}`);
                    console.log(`🆔 ID: ${radio.id}`);
                    console.log(`🌍 Región: ${radio.region || 'No especificada'}`);
                    console.log(`🔗 URL: ${radio.stream_url || 'No especificada'}`);
                    console.log(`📊 Estado: ${radio.status || 'No especificado'}`);
                    console.log('════════════════════════════════════════\n');
                    
                    found = true;
                    
                    // Si encontramos la radio, verificar su stream
                    if (radio.stream_url) {
                        console.log('🔍 Verificando el stream...');
                        await verifyStream(radio.stream_url);
                    }
                    break;
                }
            }

            if (!found) {
                console.log(`   Procesadas ${radios.length} radios en esta página`);
                offset += LIMIT;
                
                // Pequeña pausa para no sobrecargar el servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error) {
            console.error(`❌ Error al procesar página: ${error.message}`);
            break;
        }
    }

    if (!found) {
        console.log(`❌ Radio Pilmaiquen no encontrada después de procesar ${totalProcessed} radios`);
    }

    console.log('\n✅ Búsqueda completada');
}

// Función para verificar el stream
async function verifyStream(streamUrl) {
    try {
        console.log(`📡 Verificando: ${streamUrl}`);
        
        const response = await makeRequest(streamUrl, {
            method: 'HEAD',
            timeout: 5000
        });
        
        console.log(`✅ Stream verificado - Status: ${response.statusCode}`);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
            console.log('🟢 El stream está ONLINE');
        } else {
            console.log('🔴 El stream está OFFLINE');
        }
        
    } catch (error) {
        console.log(`❌ Error verificando stream: ${error.message}`);
        console.log('🔴 El stream está OFFLINE');
    }
}

// Ejecutar la búsqueda
searchRadioPilmaiquen().catch(console.error);