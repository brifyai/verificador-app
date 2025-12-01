#!/usr/bin/env node

/**
 * Script simple para verificar Radio Somos con el verificador que ya funciona
 */

const https = require('https');
const http = require('http');

async function testRadioSomosSimple() {
    console.log('🎵 Probando Radio Somos de Petorca...\n');

    const streamUrl = 'https://streaming1.tecnoera.com:8227/';
    
    try {
        console.log(`📡 Verificando: ${streamUrl}`);
        
        // Hacer una petición HEAD para verificar el estado
        const url = new URL(streamUrl);
        const protocol = url.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'HEAD',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
            }
        };

        const req = protocol.request(url, options, (res) => {
            console.log(`✅ Respuesta HTTP: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - Server: ${res.headers['server']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            console.log(`   - icy-br: ${res.headers['icy-br']}`);
            console.log(`   - icy-metaint: ${res.headers['icy-metaint']}`);
            
            // Verificar si es un stream de audio
            const contentType = res.headers['content-type'] || '';
            const isAudioStream = contentType.includes('audio') || 
                                 res.headers['icy-name'] || 
                                 res.headers['icy-br'];
            
            if (isAudioStream) {
                console.log('\n🎉 ¡ÉXITO! Es un stream de audio válido');
                console.log('✅ Radio Somos está ONLINE');
                
                if (res.headers['icy-name']) {
                    console.log(`   - Nombre del stream: ${res.headers['icy-name']}`);
                }
                if (res.headers['icy-br']) {
                    console.log(`   - Bitrate: ${res.headers['icy-br']} kbps`);
                }
                
                // Detectar tipo de servidor
                if (res.headers['server'] && res.headers['server'].toLowerCase().includes('icecast')) {
                    console.log('✅ Servidor Icecast detectado');
                } else if (res.headers['icy-name']) {
                    console.log('✅ Servidor Shoutcast detectado');
                }
                
                // Detectar Tecnoera
                if (streamUrl.includes('tecnoera')) {
                    console.log('✅ Plataforma Tecnoera detectada');
                }
                
            } else {
                console.log('\n⚠️  No parece ser un stream de audio');
                console.log(`   - Content-Type: ${contentType}`);
            }
            
            // Hacer una verificación más completa con RANGE request
            console.log('\n📡 Verificando con RANGE request...');
            
            const rangeOptions = {
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1024',
                    'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
                },
                timeout: 10000
            };
            
            const rangeReq = protocol.request(url, rangeOptions, (rangeRes) => {
                console.log(`✅ RANGE Response: ${rangeRes.statusCode} ${rangeRes.statusText}`);
                console.log(`   - Content-Type: ${rangeRes.headers['content-type']}`);
                console.log(`   - Accept-Ranges: ${rangeRes.headers['accept-ranges']}`);
                console.log(`   - Content-Length: ${rangeRes.headers['content-length']}`);
                
                if (rangeRes.statusCode === 206) {
                    console.log('✅ RANGE request exitoso - el stream soporta rangos');
                }
                
                rangeRes.on('data', () => {}); // Consumir datos
                rangeRes.on('end', () => {
                    console.log('\n✅ Verificación completada');
                });
            });
            
            rangeReq.on('error', (err) => {
                console.log(`⚠️  Error en RANGE request: ${err.message}`);
            });
            
            rangeReq.on('timeout', () => {
                console.log('⚠️  TIMEOUT en RANGE request');
                rangeReq.destroy();
            });
            
            rangeReq.end();
        });

        req.on('error', (err) => {
            console.log(`❌ Error al conectar: ${err.message}`);
            
            // Si falla HEAD, intentar con GET
            if (err.code === 'ECONNRESET' || err.message.includes('socket')) {
                console.log('\n📡 Intentando con GET request...');
                testWithGet();
            }
        });

        req.on('timeout', () => {
            console.log('⚠️  TIMEOUT en HEAD request');
            req.destroy();
            
            // Intentar con GET
            console.log('\n📡 Intentando con GET request...');
            testWithGet();
        });

        req.end();

    } catch (error) {
        console.log('❌ Error general:', error.message);
        console.log('Stack:', error.stack);
    }
}

function testWithGet() {
    const streamUrl = 'https://streaming1.tecnoera.com:8227/';
    console.log(`📡 GET Verificando: ${streamUrl}`);
    
    const url = new URL(streamUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
        method: 'GET',
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
            'Range': 'bytes=0-1024' // Solo pedir primeros bytes
        }
    };

    const req = protocol.request(url, options, (res) => {
        console.log(`✅ GET Response: ${res.statusCode} ${res.statusText}`);
        console.log(`   - Content-Type: ${res.headers['content-type']}`);
        console.log(`   - icy-name: ${res.headers['icy-name']}`);
        console.log(`   - icy-br: ${res.headers['icy-br']}`);
        
        const contentType = res.headers['content-type'] || '';
        const isAudioStream = contentType.includes('audio') || 
                             res.headers['icy-name'] || 
                             res.headers['icy-br'];
        
        if (isAudioStream) {
            console.log('\n🎉 ¡ÉXITO! Es un stream de audio válido');
            console.log('✅ Radio Somos está ONLINE con GET request');
        }
        
        res.on('data', () => {}); // Consumir datos
        res.on('end', () => {
            console.log('\n✅ Verificación GET completada');
        });
    });

    req.on('error', (err) => {
        console.log(`❌ Error en GET request: ${err.message}`);
    });

    req.on('timeout', () => {
        console.log('⚠️  TIMEOUT en GET request');
        req.destroy();
    });

    req.end();
}

// Ejecutar
testRadioSomosSimple();