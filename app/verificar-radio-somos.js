#!/usr/bin/env node

/**
 * Script para verificar el estado actual de Radio Somos
 */

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQzOTE3MzM3MDciLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDU1MTMxNSwiZXhwIjoxNzY0NjM3NzE1fQ.5q7gH127ggkniHP5X3mMCqHMmypFyfg6FWCqnVSgeA8';

async function verificarRadioSomos() {
    console.log('🔍 Verificando estado de Radio Somos...\n');

    try {
        // Buscar por nombre
        console.log('📡 Buscando Radio Somos por nombre...');
        
        const response = await fetch('http://localhost:3000/api/radios-direct?name=Somos', {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });

        if (!response.ok) {
            console.log('❌ Error al buscar:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            const radio = data[0];
            console.log('✅ Radio Somos encontrada:');
            console.log(`   - ID: ${radio.id}`);
            console.log(`   - Nombre: ${radio.name}`);
            console.log(`   - Región: ${radio.region}`);
            console.log(`   - URL: ${radio.stream_url}`);
            console.log(`   - Estado: ${radio.last_verification_status}`);
            console.log(`   - Plataforma: ${radio.platform}`);
            console.log(`   - Última verificación: ${radio.last_verified}`);
            
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
            
        } else {
            console.log('❌ Radio Somos no encontrada');
        }

        // También buscar por la URL específica
        console.log('\n📡 Buscando por URL de Tecnoera...');
        
        const urlResponse = await fetch('http://localhost:3000/api/radios-direct?stream_url=streaming1.tecnoera.com', {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });

        if (urlResponse.ok) {
            const urlData = await urlResponse.json();
            if (Array.isArray(urlData) && urlData.length > 0) {
                console.log('✅ Radios con URL de Tecnoera encontradas:');
                urlData.forEach(radio => {
                    console.log(`   - ${radio.name} (${radio.region}):`);
                    console.log(`     URL: ${radio.stream_url}`);
                    console.log(`     Estado: ${radio.last_verification_status}`);
                    console.log(`     Plataforma: ${radio.platform}`);
                    console.log('');
                });
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

verificarRadioSomos();