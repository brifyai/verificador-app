#!/usr/bin/env node

/**
 * Script para encontrar el enlace .pls en Radio Somos
 */

const https = require('https');

// Ignorar errores de certificado SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function findPLSLink() {
    console.log('🔍 Buscando enlace .pls en Radio Somos de Petorca...\n');

    const baseUrl = 'https://streaming1.tecnoera.com:8227';
    const redirectUrl = 'https://streaming1.tecnoera.com:8227/index.html?sid=1';
    
    try {
        console.log(`📡 Accediendo a: ${redirectUrl}`);
        
        const options = {
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = https.request(new URL(redirectUrl), options, (res) => {
            console.log(`✅ Respuesta HTTP: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            
            let content = '';
            res.on('data', (chunk) => {
                content += chunk.toString();
            });
            
            res.on('end', () => {
                console.log(`\n📄 HTML recibido (${content.length} bytes):`);
                
                // Buscar enlaces .pls
                const plsMatches = content.match(/href="([^"]*\.pls)"/g);
                
                if (plsMatches) {
                    console.log('\n📁 ENLACES .pls ENCONTRADOS:');
                    plsMatches.forEach((match, index) => {
                        const url = match.match(/href="([^"]*)"/)[1];
                        console.log(`   ${index + 1}. ${url}`);
                        
                        // Si es relativo, construir URL completa
                        let fullUrl = url;
                        if (url.startsWith('/') || !url.startsWith('http')) {
                            fullUrl = baseUrl + (url.startsWith('/') ? url : '/' + url);
                        }
                        console.log(`      URL completa: ${fullUrl}`);
                        
                        // Analizar el primer .pls encontrado
                        if (index === 0) {
                            console.log(`\n🔍 Analizando: ${fullUrl}`);
                            analyzePLSFile(fullUrl);
                        }
                    });
                } else {
                    console.log('\n❌ No se encontraron enlaces .pls');
                    
                    // Buscar otros patrones comunes
                    console.log('\n🔍 Buscando otros patrones...');
                    
                    // Buscar enlaces con "listen" o "stream"
                    const listenMatches = content.match(/href="([^"]*(listen|stream)[^"]*)"/gi);
                    if (listenMatches) {
                        console.log('\n🔗 ENLACES CON "listen" o "stream":');
                        listenMatches.forEach(match => {
                            const url = match.match(/href="([^"]*)"/)[1];
                            console.log(`   - ${url}`);
                        });
                    }
                    
                    // Buscar en el contenido directamente
                    console.log('\n📄 Fragmento del HTML:');
                    console.log(content.substring(0, 1000));
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Error al conectar: ${err.message}`);
        });

        req.on('timeout', () => {
            console.log('⚠️  TIMEOUT en la petición');
            req.destroy();
        });

        req.end();

    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

function analyzePLSFile(plsUrl) {
    console.log(`\n📁 Descargando archivo .pls: ${plsUrl}`);
    
    try {
        const options = {
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = https.request(new URL(plsUrl), options, (res) => {
            console.log(`✅ Respuesta PLS: ${res.statusCode} ${res.statusText}`);
            
            let plsContent = '';
            res.on('data', (chunk) => {
                plsContent += chunk.toString();
            });
            
            res.on('end', () => {
                console.log(`\n📄 CONTENIDO PLS (${plsContent.length} bytes):`);
                console.log(plsContent);
                
                // Parsear el archivo PLS
                console.log('\n🔍 ANALIZANDO ARCHIVO PLS...');
                
                const lines = plsContent.split('\n');
                let foundStreamUrl = null;
                let foundTitle = null;
                let foundLength = null;
                
                for (const line of lines) {
                    const lineLower = line.toLowerCase();
                    if (lineLower.startsWith('file1=')) {
                        foundStreamUrl = line.split('=')[1].trim();
                    } else if (lineLower.startsWith('title1=')) {
                        foundTitle = line.split('=')[1].trim();
                    } else if (lineLower.startsWith('length1=')) {
                        foundLength = line.split('=')[1].trim();
                    }
                }
                
                if (foundStreamUrl) {
                    console.log('\n🎉 ¡INFORMACIÓN DEL STREAM ENCONTRADA!');
                    console.log(`   📻 URL del stream: ${foundStreamUrl}`);
                    console.log(`   📝 Título: ${foundTitle || 'No especificado'}`);
                    console.log(`   ⏱️  Duración: ${foundLength || 'No especificada'}`);
                    
                    // Verificar el stream directo
                    verifyDirectStream(foundStreamUrl);
                } else {
                    console.log('❌ No se encontró URL del stream en el archivo PLS');
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Error al descargar PLS: ${err.message}`);
        });

        req.end();

    } catch (error) {
        console.log(`❌ Error al analizar PLS: ${error.message}`);
    }
}

function verifyDirectStream(directUrl) {
    console.log(`\n📡 Verificando stream directo: ${directUrl}`);
    
    try {
        const options = {
            method: 'HEAD',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = https.request(new URL(directUrl), options, (res) => {
            console.log(`✅ Stream directo: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            console.log(`   - icy-br: ${res.headers['icy-br']}`);
            console.log(`   - icy-metaint: ${res.headers['icy-metaint']}`);
            
            const contentType = res.headers['content-type'] || '';
            const isAudioStream = contentType.includes('audio') || 
                                 res.headers['icy-name'] || 
                                 res.headers['icy-br'] ||
                                 res.headers['icy-metaint'];
            
            if (isAudioStream) {
                console.log('\n🎉 ¡ÉXITO! El stream directo es válido');
                console.log('✅ RADIO SOMOS ESTÁ ONLINE');
                console.log('✅ El sistema .pls funciona correctamente');
            } else {
                console.log('\n⚠️  El stream directo no parece ser audio');
                console.log('   - Content-Type:', contentType);
                console.log('   - Headers:', Object.keys(res.headers));
            }
        });

        req.on('error', (err) => {
            console.log(`⚠️  Error al verificar stream directo: ${err.message}`);
            
            // Si HEAD falla, probar con GET
            console.log('\n🔍 Intentando con petición GET...');
            verifyDirectStreamGET(directUrl);
        });

        req.end();

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

function verifyDirectStreamGET(directUrl) {
    console.log(`\n📡 Verificando con GET: ${directUrl}`);
    
    try {
        const options = {
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = https.request(new URL(directUrl), options, (res) => {
            console.log(`✅ GET Response: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            console.log(`   - icy-br: ${res.headers['icy-br']}`);
            
            const contentType = res.headers['content-type'] || '';
            const isAudioStream = contentType.includes('audio') || 
                                 res.headers['icy-name'] || 
                                 res.headers['icy-br'];
            
            if (isAudioStream) {
                console.log('\n🎉 ¡ÉXITO! El stream directo es válido');
                console.log('✅ RADIO SOMOS ESTÁ ONLINE');
            } else {
                console.log('\n⚠️  El stream no parece ser audio');
            }
            
            // Consumir datos para cerrar la conexión
            res.on('data', () => {});
            res.on('end', () => {});
        });

        req.on('error', (err) => {
            console.log(`❌ Error GET: ${err.message}`);
        });

        req.end();

    } catch (error) {
        console.log(`❌ Error GET: ${error.message}`);
    }
}

// Ejecutar
findPLSLink();