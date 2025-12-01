#!/usr/bin/env node

/**
 * Script para buscar Radio Somos usando el token válido del admin
 */

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTE3NjQzOTE3MzM3MDciLCJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NDU1MTMxNSwiZXhwIjoxNzY0NjM3NzE1fQ.5q7gH127ggkniHP5X3mMCqHMmypFyfg6FWCqnVSgeA8';

async function buscarRadioSomos() {
    console.log('🔍 Buscando Radio Somos de Petorca...\n');

    try {
        console.log('📡 Obteniendo lista de radios...');
        
        const response = await fetch('http://localhost:3000/api/radios-direct?limit=1000', {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });

        if (!response.ok) {
            console.log('❌ Error al obtener radios:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error detallado:', errorText);
            return;
        }

        const radios = await response.json();
        console.log(`✅ Encontradas ${radios.length} radios en total\n`);

        // Buscar por diferentes criterios
        const criterios = [
            { campo: 'name', valor: 'somos', descripcion: 'Nombre contiene "somos"' },
            { campo: 'name', valor: 'petorca', descripcion: 'Nombre contiene "petorca"' },
            { campo: 'stream_url', valor: 'tecnoera', descripcion: 'URL contiene "tecnoera"' },
            { campo: 'stream_url', valor: 'streaming1.tecnoera.com:8227', descripcion: 'URL exacta de Tecnoera' }
        ];

        let radioEncontrada = null;

        for (const criterio of criterios) {
            console.log(`🔎 Buscando por: ${criterio.descripcion}...`);
            
            const radio = radios.find(r => 
                r[criterio.campo] && 
                r[criterio.campo].toLowerCase().includes(criterio.valor.toLowerCase())
            );

            if (radio) {
                console.log(`✅ ¡Encontrada!`);
                console.log(`   - ID: ${radio.id}`);
                console.log(`   - Nombre: ${radio.name}`);
                console.log(`   - URL: ${radio.stream_url}`);
                console.log(`   - Región: ${radio.region}`);
                console.log(`   - Estado actual: ${radio.last_verification_status}`);
                console.log(`   - Plataforma actual: ${radio.platform || 'N/A'}`);
                radioEncontrada = radio;
                break;
            } else {
                console.log(`❌ No encontrada\n`);
            }
        }

        if (!radioEncontrada) {
            console.log('❌ Radio Somos no encontrada con ningún criterio');
            
            // Mostrar algunas radios de la región de Valparaíso (Petorca está en Valparaíso)
            console.log('\n📍 Radios de la región de Valparaíso:');
            const radiosValparaiso = radios.filter(r => 
                r.region && r.region.toLowerCase().includes('valparaíso')
            ).slice(0, 5);
            
            radiosValparaiso.forEach(radio => {
                console.log(`   - ${radio.name} (${radio.region}): ${radio.stream_url}`);
                console.log(`     Estado: ${radio.last_verification_status}`);
            });

            // Mostrar algunas radios con URLs similares
            console.log('\n📻 Radios con URLs que contienen "stream":');
            const radiosStream = radios.filter(r => 
                r.stream_url && r.stream_url.includes('stream')
            ).slice(0, 5);
            
            radiosStream.forEach(radio => {
                console.log(`   - ${radio.name}: ${radio.stream_url}`);
                console.log(`     Estado: ${radio.last_verification_status}`);
            });

            return;
        }

        // Actualizar el estado usando la API
        console.log('\n🔄 Actualizando estado a ONLINE...');
        
        const updateResponse = await fetch(
            `http://localhost:3000/api/radios/${radioEncontrada.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify({
                    last_verification_status: 'ONLINE',
                    last_verified: new Date().toISOString(),
                    platform: 'TECNOERA'
                })
            }
        );

        if (updateResponse.ok) {
            console.log('✅ ¡Radio actualizada exitosamente!');
            console.log(`   - Nuevo estado: ONLINE`);
            console.log(`   - Plataforma: TECNOERA`);
            console.log(`   - Fecha: ${new Date().toISOString()}`);
            
            // Verificar la actualización
            console.log('\n🔍 Verificando actualización...');
            const verifyResponse = await fetch(
                `http://localhost:3000/api/radios/${radioEncontrada.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${ADMIN_TOKEN}`
                    }
                }
            );
            
            if (verifyResponse.ok) {
                const updatedRadio = await verifyResponse.json();
                console.log('✅ Estado actual en base de datos:');
                console.log(`   - Status: ${updatedRadio.last_verification_status}`);
                console.log(`   - Platform: ${updatedRadio.platform}`);
                console.log(`   - Last Verified: ${updatedRadio.last_verified}`);
            }
            
        } else {
            console.log('❌ Error al actualizar:', updateResponse.status, updateResponse.statusText);
            const errorData = await updateResponse.text();
            console.log('Respuesta:', errorData);
        }

    } catch (error) {
        console.log('❌ Error general:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Ejecutar
buscarRadioSomos();