#!/usr/bin/env node

/**
 * Script simple para buscar Radio Somos usando fetch
 */

async function buscarRadioSomos() {
    console.log('🔍 Buscando Radio Somos de Petorca...\n');

    try {
        // Usar el endpoint que ya vimos funcionando
        console.log('📡 Obteniendo lista de radios...');
        
        const response = await fetch('http://localhost:3000/api/radios-direct?limit=1000', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsInN1YiI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsImlhdCI6MTczMzAxNTI5NCwiZXhwIjoxNzMzNjIwMDk0fQ.WVVL5jC2f1x9x2KJX8H5vJBL3sP8xZfX9xX9xX9xX9xX'
            }
        });

        if (!response.ok) {
            console.log('❌ Error al obtener radios:', response.status, response.statusText);
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
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsInN1YiI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsImlhdCI6MTczMzAxNTI5NCwiZXhwIjoxNzMzNjIwMDk0fQ.WVVL5jC2f1x9x2KJX8H5vJBL3sP8xZfX9xX9xX9xX9xX'
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
        } else {
            console.log('❌ Error al actualizar:', updateResponse.status, updateResponse.statusText);
            const errorData = await updateResponse.text();
            console.log('Respuesta:', errorData);
        }

    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

// Ejecutar
buscarRadioSomos();