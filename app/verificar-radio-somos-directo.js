#!/usr/bin/env node

/**
 * Script para verificar el estado actual de Radio Somos usando el ID directo
 */

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQzOTE3MzM3MDciLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDU1MTMxNSwiZXhwIjoxNzY0NjM3NzE1fQ.5q7gH127ggkniHP5X3mMCqHMmypFyfg6FWCqnVSgeA8';

async function verificarRadioSomosDirecto() {
    console.log('🔍 Verificando estado de Radio Somos (ID directo)...\n');

    const radioId = 'radio_mijm9y5h_hlfewbl'; // ID que encontramos anteriormente

    try {
        console.log(`📡 Obteniendo datos de la radio ID: ${radioId}...`);
        
        const response = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });

        if (!response.ok) {
            console.log('❌ Error al obtener la radio:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error detallado:', errorText);
            return;
        }

        const radio = await response.json();
        
        console.log('✅ Datos de Radio Somos:');
        console.log(`   - ID: ${radio.id}`);
        console.log(`   - Nombre: ${radio.name}`);
        console.log(`   - Región: ${radio.region}`);
        console.log(`   - URL: ${radio.stream_url}`);
        console.log(`   - Estado: ${radio.last_verification_status}`);
        console.log(`   - Plataforma: ${radio.platform}`);
        console.log(`   - Última verificación: ${radio.last_verified}`);
        console.log(`   - Fecha de creación: ${radio.created_at}`);
        console.log(`   - Fecha de actualización: ${radio.updated_at}`);
        
        // Verificar que sea la URL correcta
        if (radio.stream_url && radio.stream_url.includes('tecnoera')) {
            console.log('\n✅ La URL contiene "tecnoera" - es la radio correcta!');
            
            // Verificar que el estado sea ONLINE
            if (radio.last_verification_status === 'ONLINE') {
                console.log('✅ ¡La radio está marcada como ONLINE!');
            } else {
                console.log(`⚠️  La radio está marcada como: ${radio.last_verification_status}`);
            }
            
            // Verificar que la plataforma sea TECNOERA
            if (radio.platform === 'TECNOERA') {
                console.log('✅ ¡La plataforma está correctamente clasificada como TECNOERA!');
            } else {
                console.log(`⚠️  La plataforma es: ${radio.platform}`);
            }
            
        } else {
            console.log('⚠️  La URL no contiene "tecnoera" - podría no ser la radio correcta');
        }

        // Verificar el stream actual
        console.log('\n🎵 Verificando el stream actual...');
        const streamUrl = 'https://streaming1.tecnoera.com:8227/';
        
        try {
            const streamResponse = await fetch(streamUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
                },
                redirect: 'follow'
            });

            console.log(`✅ Stream responde con: ${streamResponse.status} ${streamResponse.statusText}`);
            console.log(`   - Content-Type: ${streamResponse.headers.get('content-type')}`);
            console.log(`   - Server: ${streamResponse.headers.get('server')}`);
            console.log(`   - icy-name: ${streamResponse.headers.get('icy-name')}`);
            console.log(`   - icy-br: ${streamResponse.headers.get('icy-br')}`);
            
            if (streamResponse.ok || streamResponse.status === 200) {
                console.log('✅ ¡El stream está accesible!');
            }
            
        } catch (streamError) {
            console.log(`⚠️  Error al verificar el stream: ${streamError.message}`);
        }

    } catch (error) {
        console.log('❌ Error general:', error.message);
        console.log('Stack:', error.stack);
    }
}

verificarRadioSomosDirecto();