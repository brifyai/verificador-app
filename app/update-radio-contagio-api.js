const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'http://localhost:3000';

// Función para obtener el token de autenticación
function getAuthToken() {
    try {
        // Intentar leer el token desde el archivo admin-token.txt
        const tokenPath = path.join(__dirname, 'admin-token.txt');
        if (fs.existsSync(tokenPath)) {
            const token = fs.readFileSync(tokenPath, 'utf8').trim();
            console.log('✅ Token encontrado en admin-token.txt');
            return token;
        }
        
        // Si no existe, intentar con el archivo valid-token.txt
        const validTokenPath = path.join(__dirname, 'valid-token.txt');
        if (fs.existsSync(validTokenPath)) {
            const token = fs.readFileSync(validTokenPath, 'utf8').trim();
            console.log('✅ Token encontrado en valid-token.txt');
            return token;
        }
        
        console.log('❌ No se encontró token en los archivos. Usando token de respaldo.');
        return null;
    } catch (error) {
        console.log('❌ Error al leer token:', error.message);
        return null;
    }
}

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// Función para obtener información de una radio por ID
async function getRadioById(radioId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }

        const response = await makeRequest(`${API_BASE_URL}/api/radios/${radioId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.statusCode === 200) {
            return JSON.parse(response.data);
        } else {
            console.log(`❌ Error al obtener radio ${radioId}:`, response.statusCode);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error al obtener radio ${radioId}:`, error.message);
        return null;
    }
}

// Función para actualizar una radio
async function updateRadio(radioId, updateData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }

        const response = await makeRequest(`${API_BASE_URL}/api/radios/${radioId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        return {
            success: response.statusCode === 200,
            statusCode: response.statusCode,
            data: response.data ? JSON.parse(response.data) : null
        };
    } catch (error) {
        console.log(`❌ Error al actualizar radio ${radioId}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función principal para actualizar Radio Contagio
async function updateRadioContagio() {
    console.log('🔄 Iniciando actualización de Radio Contagio...\n');
    
    try {
        // Paso 1: Buscar la radio por nombre o stream_url actual
        console.log('🔍 Buscando Radio Contagio en el sistema...');
        
        // Intentar diferentes formas de buscar la radio
        const searchTerms = ['Contagio', 'contagio', 'Radio Contagio', 'radio contagio'];
        let radioFound = null;
        
        // Primero intentamos buscar por el stream_url actual
        const currentUrl = 'https://sonic.streamingchilenos.com:7113/';
        console.log(`Buscando con URL actual: ${currentUrl}`);
        
        // Como no tenemos endpoint de búsqueda, intentaremos con IDs comunes
        const possibleIds = [
            'radio_mijm9yge_lagcxh3', // ID que vimos en los logs
            'radio_mijm9yge_1lagcxh3',
            'radio_mijm9yge_2lagcxh3',
            'radio_contagio_2024',
            'radio-contagio-main'
        ];
        
        for (const radioId of possibleIds) {
            console.log(`Intentando con ID: ${radioId}`);
            const radio = await getRadioById(radioId);
            if (radio) {
                console.log(`✅ Radio encontrada con ID: ${radioId}`);
                console.log(`Nombre: ${radio.name}`);
                console.log(`URL actual: ${radio.stream_url}`);
                radioFound = radio;
                break;
            }
        }
        
        if (!radioFound) {
            console.log('❌ No se pudo encontrar Radio Contagio con los IDs probados');
            console.log('📝 Por favor, proporciona el ID correcto de Radio Contagio');
            return;
        }
        
        // Paso 2: Verificar la nueva URL con el endpoint correcto
        const newUrl = 'https://sonic.streamingchilenos.com:7114/index.html?sid=1';
        console.log(`\n🔍 Verificando nueva URL: ${newUrl}`);
        
        const verificationResult = await verificarStreamSonicPanel(newUrl);
        console.log('Resultado de verificación:', verificationResult);
        
        if (!verificationResult.online) {
            console.log('❌ La nueva URL no está online. No se realizará la actualización.');
            return;
        }
        
        // Paso 3: Actualizar la radio
        console.log(`\n🔄 Actualizando Radio Contagio...`);
        console.log(`De: ${radioFound.stream_url}`);
        console.log(`A: ${newUrl}`);
        
        const updateResult = await updateRadio(radioFound.id, {
            stream_url: newUrl,
            status: 'ACTIVE',
            last_verification: new Date().toISOString()
        });
        
        if (updateResult.success) {
            console.log('✅ Radio Contagio actualizada exitosamente');
            console.log('📊 Datos actualizados:', {
                id: radioFound.id,
                nombre: updateResult.data?.name || radioFound.name,
                nueva_url: newUrl,
                estado: 'ACTIVE'
            });
        } else {
            console.log('❌ Error al actualizar la radio:', updateResult.statusCode);
            if (updateResult.data) {
                console.log('Detalles:', updateResult.data);
            }
        }
        
    } catch (error) {
        console.log('❌ Error en el proceso:', error.message);
    }
}

// Función para verificar streams de SonicPanel
async function verificarStreamSonicPanel(url) {
    try {
        console.log(`Verificando SonicPanel: ${url}`);
        
        // Intentar con el endpoint correcto para SonicPanel
        const sonicPanelUrl = url.includes('index.html') ? url : url.replace(/\/$/, '') + '/index.html?sid=1';
        
        const response = await makeRequest(sonicPanelUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Winamp/5.8',
                'Icy-MetaData': '1',
                'Accept': 'audio/mpeg,audio/*'
            }
        });
        
        console.log(`Status: ${response.statusCode}`);
        console.log('Headers:', response.headers);
        
        if (response.statusCode === 200) {
            // Verificar headers de SHOUTcast/SonicPanel
            const contentType = response.headers['content-type'];
            const icyName = response.headers['icy-name'];
            const icyGenre = response.headers['icy-genre'];
            const icyBr = response.headers['icy-br'];
            
            console.log(`Content-Type: ${contentType}`);
            console.log(`ICY-Name: ${icyName}`);
            console.log(`ICY-Genre: ${icyGenre}`);
            console.log(`ICY-Br: ${icyBr}`);
            
            // Verificar si es un stream de audio válido
            if (contentType && (
                contentType.includes('audio') || 
                contentType.includes('mpeg') || 
                contentType.includes('mp3') ||
                contentType.includes('aac') ||
                contentType.includes('ogg')
            )) {
                return {
                    online: true,
                    statusCode: response.statusCode,
                    contentType: contentType,
                    icyName: icyName,
                    icyGenre: icyGenre,
                    icyBr: icyBr,
                    method: 'sonicpanel',
                    url: sonicPanelUrl
                };
            }
        }
        
        // Si no funciona con el endpoint completo, probar el stream directo
        console.log('Intentando con stream directo...');
        return await verificarStreamDirecto(url);
        
    } catch (error) {
        console.log(`Error en verificación SonicPanel: ${error.message}`);
        return {
            online: false,
            error: error.message
        };
    }
}

// Función para verificar stream directo
async function verificarStreamDirecto(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Winamp/5.8',
                'Icy-MetaData': '1',
                'Accept': 'audio/mpeg,audio/*'
            },
            timeout: 10000,
            rejectUnauthorized: false
        };
        
        const req = https.request(options, (res) => {
            console.log(`Direct Stream Status: ${res.statusCode}`);
            console.log(`Direct Stream Headers:`, res.headers);
            
            if (res.statusCode === 200) {
                // Verificar headers de SHOUTcast
                const icyName = res.headers['icy-name'];
                const icyGenre = res.headers['icy-genre'];
                const icyBr = res.headers['icy-br'];
                const contentType = res.headers['content-type'];
                
                console.log(`ICY-Name: ${icyName}`);
                console.log(`ICY-Genre: ${icyGenre}`);
                console.log(`ICY-Br: ${icyBr}`);
                console.log(`Content-Type: ${contentType}`);
                
                res.destroy(); // Cerrar conexión
                
                resolve({
                    online: true,
                    statusCode: res.statusCode,
                    icyName: icyName,
                    icyGenre: icyGenre,
                    icyBr: icyBr,
                    contentType: contentType,
                    method: 'direct'
                });
            } else {
                res.destroy();
                resolve({
                    online: false,
                    statusCode: res.statusCode
                });
            }
        });
        
        req.on('error', (error) => {
            console.log(`Direct Stream Error: ${error.message}`);
            resolve({
                online: false,
                error: error.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                online: false,
                error: 'timeout'
            });
        });
        
        req.end();
    });
}

// Ejecutar el script
if (require.main === module) {
    updateRadioContagio().catch(console.error);
}

module.exports = { updateRadioContagio, verificarStreamSonicPanel };