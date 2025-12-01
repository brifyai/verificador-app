const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'http://localhost:3000';
const RADIO_ID = 'radio_mijm9yge_lagcxh3'; // ID correcto de Radio Contagio

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
        
        console.log('❌ No se encontró token en los archivos');
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
        const client = isHttps ? https : require('http');
        
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

// Función para obtener información de la radio
async function getRadioInfo(radioId) {
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

// Función para actualizar la radio
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

// Función principal
async function updateRadioContagio() {
    console.log('🔄 Iniciando actualización de Radio Contagio...\n');
    
    try {
        // Paso 1: Obtener información actual de la radio
        console.log(`🔍 Obteniendo información de Radio Contagio (ID: ${RADIO_ID})...`);
        
        const radio = await getRadioInfo(RADIO_ID);
        if (!radio) {
            console.log('❌ No se pudo obtener la información de la radio');
            return;
        }
        
        console.log('✅ Información obtenida:');
        console.log(`   Nombre: ${radio.name || radio.nombre || 'Sin nombre'}`);
        console.log(`   URL actual: ${radio.stream_url || 'Sin URL'}`);
        console.log(`   Estado: ${radio.status || 'Sin estado'}`);
        console.log(`   Región: ${radio.region || 'Sin región'}`);
        
        // Paso 2: Verificar la nueva URL
        const newUrl = 'https://sonic.streamingchilenos.com:7114/';
        console.log(`\n🔍 Verificando nueva URL: ${newUrl}`);
        
        const verificationResult = await verificarStream(newUrl);
        console.log('Resultado de verificación:', verificationResult);
        
        if (!verificationResult.online) {
            console.log('❌ La nueva URL no está online. No se realizará la actualización.');
            return;
        }
        
        // Paso 3: Actualizar la radio
        console.log(`\n🔄 Actualizando Radio Contagio...`);
        console.log(`De: ${radio.stream_url || 'Sin URL'}`);
        console.log(`A: ${newUrl}`);
        
        const updateResult = await updateRadio(RADIO_ID, {
            stream_url: newUrl,
            status: 'ACTIVE',
            last_verification: new Date().toISOString()
        });
        
        if (updateResult.success) {
            console.log('✅ Radio Contagio actualizada exitosamente');
            console.log('📊 Datos actualizados:', {
                id: RADIO_ID,
                nombre: updateResult.data?.name || radio.name,
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

// Función para verificar el stream
async function verificarStream(url) {
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
            console.log(`Stream Status: ${res.statusCode}`);
            console.log(`Stream Headers:`, {
                'content-type': res.headers['content-type'],
                'server': res.headers['server'],
                'icy-name': res.headers['icy-name'],
                'icy-genre': res.headers['icy-genre'],
                'icy-br': res.headers['icy-br']
            });
            
            const contentType = res.headers['content-type'];
            const server = res.headers['server'];
            const icyName = res.headers['icy-name'];
            const icyBr = res.headers['icy-br'];
            
            res.destroy(); // Cerrar conexión
            
            // Verificar si es un stream válido
            const isValidStream = (
                (contentType && (
                    contentType.includes('audio') || 
                    contentType.includes('mpeg') || 
                    contentType.includes('mp3') ||
                    contentType.includes('aac') ||
                    contentType.includes('ogg')
                )) ||
                (server && server.toLowerCase().includes('sonicpanel')) ||
                icyName ||
                icyBr
            );
            
            resolve({
                online: isValidStream,
                statusCode: res.statusCode,
                contentType: contentType,
                server: server,
                icyName: icyName,
                icyBr: icyBr,
                method: 'direct'
            });
        });
        
        req.on('error', (error) => {
            console.log(`Stream Error: ${error.message}`);
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

module.exports = { updateRadioContagio };