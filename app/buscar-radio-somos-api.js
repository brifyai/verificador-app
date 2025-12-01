#!/usr/bin/env node

/**
 * Script para buscar Radio Somos usando la API directa
 */

const https = require('https');

// Configuración
const API_BASE = 'http://localhost:3000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsInN1YiI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsImlhdCI6MTczMzAxNTI5NCwiZXhwIjoxNzMzNjIwMDk0fQ.WVVL5jC2f1x9x2KJX8H5vJBL3sP8xZfX9xX9xX9xX9xX';

async function hacerRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function buscarRadioSomos() {
    console.log('🔍 Buscando Radio Somos de Petorca...\n');

    try {
        // 1. Obtener todas las radios
        console.log('📡 Obteniendo lista de radios...');
        const response = await hacerRequest(`${API_BASE}/radios-direct?limit=1000`);
        
        if (response.status !== 200) {
            console.log('❌ Error al obtener radios:', response.status);
            return;
        }

        const radios = response.data;
        console.log(`✅ Encontradas ${radios.length} radios en total\n`);

        // 2. Buscar por diferentes criterios
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

            return;
        }

        // 3. Actualizar el estado usando la API
        console.log('\n🔄 Actualizando estado a ONLINE...');
        
        const updateResponse = await hacerRequest(
            `${API_BASE}/radios/${radioEncontrada.id}`,
            'PUT',
            {
                last_verification_status: 'ONLINE',
                last_verified: new Date().toISOString(),
                platform: 'TECNOERA'
            }
        );

        if (updateResponse.status === 200) {
            console.log('✅ ¡Radio actualizada exitosamente!');
            console.log(`   - Nuevo estado: ONLINE`);
            console.log(`   - Plataforma: TECNOERA`);
            console.log(`   - Fecha: ${new Date().toISOString()}`);
        } else {
            console.log('❌ Error al actualizar:', updateResponse.status);
            console.log('Respuesta:', updateResponse.data);
        }

    } catch (error) {
        console.log('❌ Error general:', error.message);
        
        // Intentar con HTTP en lugar de HTTPS
        console.log('\n🔄 Intentando con HTTP...');
        try {
            const httpResponse = await fetch(`${API_BASE.replace('https', 'http')}/radios-direct?limit=1000`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            
            if (httpResponse.ok) {
                const radios = await httpResponse.json();
                console.log(`✅ Encontradas ${radios.length} radios (vía HTTP)`);
            }
        } catch (httpError) {
            console.log('❌ HTTP también falló:', httpError.message);
        }
    }
}

// Ejecutar
buscarRadioSomos();