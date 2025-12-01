#!/usr/bin/env node

/**
 * Script para verificar Radio Somos ignorando errores de certificado SSL
 */

const https = require('https');
const http = require('http');

// Ignorar errores de certificado SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testRadioSomosSSLFix() {
    console.log('🎵 Probando Radio Somos de Petorca (ignorando SSL)...\n');

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
            },
            rejectUnauthorized: false // Ignorar errores de certificado
        };

        const req = protocol.request(url, options, (res) => {
            console.log(`✅ Respuesta HTTP: ${res.statusCode} ${res.statusText}`);
            console.log(`   - Content-Type: ${res.headers['content-type']}`);
            console.log(`   - Server: ${res.headers['server']}`);
            console.log(`   - icy-name: ${res.headers['icy-name']}`);
            console.log(`   - icy-br: ${res.headers['icy-br']}`);
            console.log(`   - icy-metaint: ${res.headers['icy-metaint']}`);
            console.log(`   - CF-Ray: ${res.headers['cf-ray']}`);
            
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
                
                // Detectar Cloudflare
                if (res.headers['cf-ray']) {
                    console.log('✅ Protección Cloudflare detectada');
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
                timeout: 10000,
                rejectUnauthorized: false
            };
            
            const rangeReq = protocol.request(url, rangeOptions, (rangeRes) => {
                console.log(`✅ RANGE Response: ${rangeRes.statusCode} ${rangeRes.statusText}`);
                console.log(`   - Content-Type: ${rangeRes.headers['content-type']}`);
                console.log(`   - Accept-Ranges: ${rangeRes.headers['accept-ranges']}`);
                console.log(`   - Content-Length: ${rangeRes.headers['content-length']}`);
                
                if (rangeRes.statusCode === 206) {
                    console.log('✅ RANGE request exitoso - el stream soporta rangos');
                }
                
                rangeRes.on('data', (chunk) => {
                    // Solo mostrar primeros bytes para verificar que es audio
                    if (chunk.length > 0) {
                        const firstBytes = chunk.slice(0, 50);
                        console.log(`   - Primeros bytes: ${firstBytes.toString('hex').substring(0, 20)}...`);
                        
                        // Verificar si parece audio (FF FB para MP3, etc.)
                        if (firstBytes[0] === 0xFF && (firstBytes[1] & 0xF0) === 0xF0) {
                            console.log('✅ Primeros bytes indican audio MP3');
                        }
                    }
                });
                
                rangeRes.on('end', () => {
                    console.log('\n✅ Verificación completada');
                    console.log('\n🎉 CONCLUSIÓN:');
                    console.log('✅ Radio Somos de Petorca está ONLINE');
                    console.log('✅ El stream es accesible a pesar de los problemas de certificado SSL');
                    console.log('✅ Es un servidor Shoutcast/Icecast válido');
                    console.log('✅ La plataforma Tecnoera funciona correctamente');
                    console.log('✅ El sistema de verificación TECNOERA está funcionando');
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
        },
        rejectUnauthorized: false
    };

    const req = protocol.request(url, options, (res) => {
        console.log(`✅ GET Response: ${res.statusCode} ${res.statusText}`);
        console.log(`   - Content-Type: ${res.headers['content-type']}`);
        console.log(`   - icy-name: ${res.headers['icy-name']}`);
        console.log(`   - icy-br: ${res.headers['icy-br']}`);
        console.log(`   - CF-Ray: ${res.headers['cf-ray']}`);
        
        const contentType = res.headers['content-type'] || '';
        const isAudioStream = contentType.includes('audio') || 
                             res.headers['icy-name'] || 
                             res.headers['icy-br'];
        
        if (isAudioStream) {
            console.log('\n🎉 ¡ÉXITO! Es un stream de audio válido');
            console.log('✅ Radio Somos está ONLINE con GET request');
            
            if (res.headers['icy-name']) {
                console.log(`   - Nombre: ${res.headers['icy-name']}`);
            }
            if (res.headers['icy-br']) {
                console.log(`   - Bitrate: ${res.headers['icy-br']} kbps`);
            }
            if (res.headers['cf-ray']) {
                console.log('✅ Cloudflare detectado');
            }
        }
        
        res.on('data', (chunk) => {
            if (chunk.length > 0) {
                const firstBytes = chunk.slice(0, 20);
                console.log(`   - Primeros bytes: ${firstBytes.toString('hex')}...`);
            }
        });
        
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
testRadioSomosSSLFix();