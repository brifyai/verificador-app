#!/usr/bin/env node

/**
 * Script para seguir la redirección de Radio Somos (versión corregida)
 */

const https = require('https');
const http = require('http');

// Ignorar errores de certificado SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testRadioSomosRedirect() {
    console.log('🎵 Siguiendo redirección de Radio Somos de Petorca...\n');

    let streamUrl = 'https://streaming1.tecnoera.com:8227/';
    const baseUrl = 'https://streaming1.tecnoera.com:8227';
    
    try {
        console.log(`📡 Verificando URL original: ${streamUrl}`);
        
        // Hacer una petición GET para seguir redirecciones
        const url = new URL(streamUrl);
        const protocol = url.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = protocol.request(url, options, (res) => {
            console.log(`✅ Respuesta HTTP: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - Location: ${res.headers['location']}`);
            console.log(`   - Server: ${res.headers['server']}`);
            console.log(`   - CF-Ray: ${res.headers['cf-ray']}`);
            
            // Si es una redirección, seguirla
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers['location']) {
                let newUrl = res.headers['location'];
                console.log(`\n🔄 Redirección detectada a: ${newUrl}`);
                
                // Si es una URL relativa, construir la URL completa
                if (newUrl.startsWith('/') || !newUrl.startsWith('http')) {
                    newUrl = baseUrl + (newUrl.startsWith('/') ? newUrl : '/' + newUrl);
                    console.log(`🔗 Construyendo URL completa: ${newUrl}`);
                }
                
                if (newUrl.includes('.pls')) {
                    console.log('📁 Es un archivo .pls playlist - vamos a analizarlo');
                    analyzePLSFile(newUrl);
                } else {
                    console.log('🔗 Siguiendo la redirección...');
                    followRedirect(newUrl);
                }
                
                res.on('data', () => {}); // Consumir datos
                res.on('end', () => {});
                return;
            }
            
            // Si no es redirección, analizar el contenido
            console.log('\n📄 Analizando contenido...');
            
            let content = '';
            res.on('data', (chunk) => {
                content += chunk.toString();
            });
            
            res.on('end', () => {
                console.log(`📄 Contenido recibido (${content.length} bytes):`);
                console.log(content.substring(0, 500));
                
                // Verificar si es HTML con enlace a .pls
                if (content.includes('.pls')) {
                    console.log('\n📁 Detectado enlace a archivo .pls en el HTML');
                    const plsMatch = content.match(/href="([^"]*\.pls)"/);
                    if (plsMatch) {
                        let plsUrl = plsMatch[1];
                        // Si es relativo, construir URL completa
                        if (plsUrl.startsWith('/') || !plsUrl.startsWith('http')) {
                            plsUrl = baseUrl + (plsUrl.startsWith('/') ? plsUrl : '/' + plsUrl);
                        }
                        console.log(`🔗 Enlace .pls encontrado: ${plsUrl}`);
                        analyzePLSFile(plsUrl);
                    }
                }
                
                // Verificar si es un stream directo
                const contentType = res.headers['content-type'] || '';
                if (contentType.includes('audio') || res.headers['icy-name']) {
                    console.log('\n🎉 ¡Es un stream de audio directo!');
                    console.log('✅ Radio Somos está ONLINE');
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
        console.log('Stack:', error.stack);
    }
}

function followRedirect(redirectUrl) {
    console.log(`\n📡 Siguiendo redirección a: ${redirectUrl}`);
    
    try {
        const parsedUrl = new URL(redirectUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = protocol.request(parsedUrl, options, (res) => {
            console.log(`✅ Respuesta HTTP: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - Location: ${res.headers['location']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            
            let content = '';
            res.on('data', (chunk) => {
                content += chunk.toString();
            });
            
            res.on('end', () => {
                console.log(`📄 Contenido recibido (${content.length} bytes):`);
                console.log(content.substring(0, 300));
                
                // Verificar si es un stream de audio
                const contentType = res.headers['content-type'] || '';
                const isAudioStream = contentType.includes('audio') || 
                                     res.headers['icy-name'] || 
                                     res.headers['icy-br'];
                
                if (isAudioStream) {
                    console.log('\n🎉 ¡Es un stream de audio!');
                    console.log('✅ Radio Somos está ONLINE');
                } else if (content.includes('.pls')) {
                    console.log('\n📁 Detectado enlace a archivo .pls');
                    const plsMatch = content.match(/href="([^"]*\.pls)"/);
                    if (plsMatch) {
                        let plsUrl = plsMatch[1];
                        // Si es relativo, construir URL completa
                        if (plsUrl.startsWith('/') || !plsUrl.startsWith('http')) {
                            plsUrl = 'https://streaming1.tecnoera.com:8227' + (plsUrl.startsWith('/') ? plsUrl : '/' + plsUrl);
                        }
                        analyzePLSFile(plsUrl);
                    }
                } else {
                    console.log('\n📄 No es un stream de audio directo');
                    console.log('🔍 Verificando si hay más redirecciones...');
                    
                    // Si hay más redirecciones
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers['location']) {
                        let newUrl = res.headers['location'];
                        if (newUrl.startsWith('/') || !newUrl.startsWith('http')) {
                            newUrl = 'https://streaming1.tecnoera.com:8227' + (newUrl.startsWith('/') ? newUrl : '/' + newUrl);
                        }
                        console.log(`🔄 Siguiente redirección: ${newUrl}`);
                        followRedirect(newUrl);
                    }
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Error en redirección: ${err.message}`);
        });

        req.end();

    } catch (error) {
        console.log(`❌ Error al procesar redirección: ${error.message}`);
    }
}

function analyzePLSFile(plsUrl) {
    console.log(`\n📁 Analizando archivo .pls: ${plsUrl}`);
    
    try {
        let fullPlsUrl = plsUrl;
        if (!plsUrl.startsWith('http')) {
            // Si es relativo, construir URL completa
            fullPlsUrl = 'https://streaming1.tecnoera.com:8227' + (plsUrl.startsWith('/') ? plsUrl : '/' + plsUrl);
        }
        
        console.log(`📡 Descargando: ${fullPlsUrl}`);
        
        const parsedUrl = new URL(fullPlsUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = protocol.request(parsedUrl, options, (res) => {
            console.log(`✅ Respuesta PLS: ${res.statusCode} ${res.statusText}`);
            
            let plsContent = '';
            res.on('data', (chunk) => {
                plsContent += chunk.toString();
            });
            
            res.on('end', () => {
                console.log(`📄 Contenido PLS (${plsContent.length} bytes):`);
                console.log(plsContent);
                
                // Parsear el archivo PLS
                console.log('\n🔍 Parseando archivo PLS...');
                
                const lines = plsContent.split('\n');
                let foundStreamUrl = null;
                
                for (const line of lines) {
                    if (line.toLowerCase().startsWith('file1=')) {
                        foundStreamUrl = line.split('=')[1].trim();
                        console.log(`🎵 URL del stream encontrada: ${foundStreamUrl}`);
                        break;
                    }
                }
                
                if (foundStreamUrl) {
                    console.log('\n🎉 ¡URL del stream encontrada en el archivo PLS!');
                    console.log('✅ Radio Somos está ONLINE');
                    console.log(`   - Stream directo: ${foundStreamUrl}`);
                    
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
        const parsedUrl = new URL(directUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'HEAD',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            },
            rejectUnauthorized: false
        };

        const req = protocol.request(parsedUrl, options, (res) => {
            console.log(`✅ Stream directo: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            console.log(`   - icy-br: ${res.headers['icy-br']}`);
            
            const contentType = res.headers['content-type'] || '';
            const isAudioStream = contentType.includes('audio') || 
                                 res.headers['icy-name'] || 
                                 res.headers['icy-br'];
            
            if (isAudioStream) {
                console.log('\n🎉 ¡ÉXITO! El stream directo es válido');
                console.log('✅ Radio Somos está definitivamente ONLINE');
            } else {
                console.log('\n⚠️  El stream directo no parece ser audio');
            }
        });

        req.on('error', (err) => {
            console.log(`⚠️  Error al verificar stream directo: ${err.message}`);
        });

        req.end();

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// Ejecutar
testRadioSomosRedirect();