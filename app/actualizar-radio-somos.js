#!/usr/bin/env node

/**
 * Script para actualizar el estado de Radio Somos de Petorca en la base de datos
 * URL: https://streaming1.tecnoera.com:8227/
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Falta configuración de Supabase');
    console.log('Variables requeridas:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function actualizarRadioSomos() {
    console.log('🎵 Actualizando Radio Somos de Petorca...\n');

    try {
        // Buscar Radio Somos en la base de datos
        console.log('🔍 Buscando Radio Somos en la base de datos...');
        
        const { data: radio, error: searchError } = await supabase
            .from('radios')
            .select('*')
            .or('name.ilike.%somos%,stream_url.ilike.%tecnoera%')
            .single();

        if (searchError || !radio) {
            console.log('🔍 Buscando con términos más amplios...');
            
            const { data: radios, error: radiosError } = await supabase
                .from('radios')
                .select('*')
                .or('name.ilike.%somos%,stream_url.ilike.%tecnoera%,name.ilike.%petorca%');

            if (radiosError || !radios || radios.length === 0) {
                console.log('❌ Radio Somos no encontrada en la base de datos');
                
                // Intentar buscar por URL exacta
                const { data: porUrl, error: urlError } = await supabase
                    .from('radios')
                    .select('*')
                    .eq('stream_url', 'https://streaming1.tecnoera.com:8227/');

                if (urlError || !porUrl || porUrl.length === 0) {
                    console.log('❌ No se encontró ninguna radio con la URL de Tecnoera');
                    return;
                }

                console.log(`✅ Encontradas ${porUrl.length} radios con URL de Tecnoera:`);
                porUrl.forEach(r => {
                    console.log(`   - ${r.name} (${r.id}): ${r.stream_url}`);
                });
                return;
            }

            console.log(`✅ Encontradas ${radios.length} radios posibles:`);
            radios.forEach(r => {
                console.log(`   - ${r.name} (${r.id}): ${r.stream_url}`);
                console.log(`     Estado: ${r.last_verification_status} | Región: ${r.region}`);
            });

            // Usar la primera radio encontrada
            const radioSeleccionada = radios[0];
            console.log(`\n🎯 Actualizando: ${radioSeleccionada.name} (${radioSeleccionada.id})`);
            
            const { error: updateError } = await supabase
                .from('radios')
                .update({
                    last_verification_status: 'ONLINE',
                    last_verified: new Date().toISOString(),
                    platform: 'TECNOERA'
                })
                .eq('id', radioSeleccionada.id);

            if (updateError) {
                console.log('❌ Error al actualizar:', updateError.message);
            } else {
                console.log('✅ Radio actualizada exitosamente');
                console.log(`   - Nuevo estado: ONLINE`);
                console.log(`   - Plataforma: TECNOERA`);
                console.log(`   - Fecha: ${new Date().toISOString()}`);
            }

            return;
        }

        console.log(`✅ Radio encontrada:`);
        console.log(`   - ID: ${radio.id}`);
        console.log(`   - Nombre: ${radio.name}`);
        console.log(`   - URL: ${radio.stream_url}`);
        console.log(`   - Estado actual: ${radio.last_verification_status}`);
        console.log(`   - Región: ${radio.region}`);

        // Actualizar el estado a ONLINE
        console.log('\n🔄 Actualizando estado a ONLINE...');
        
        const { error: updateError } = await supabase
            .from('radios')
            .update({
                last_verification_status: 'ONLINE',
                last_verified: new Date().toISOString(),
                platform: 'TECNOERA'
            })
            .eq('id', radio.id);

        if (updateError) {
            console.log('❌ Error al actualizar:', updateError.message);
            return;
        }

        console.log('✅ ¡Radio Somos actualizada exitosamente!');
        console.log(`   - Nuevo estado: ONLINE`);
        console.log(`   - Plataforma: TECNOERA`);
        console.log(`   - Fecha de verificación: ${new Date().toISOString()}`);

        // Verificar la actualización
        console.log('\n🔍 Verificando actualización...');
        const { data: verificacion, error: verifyError } = await supabase
            .from('radios')
            .select('last_verification_status, last_verified, platform')
            .eq('id', radio.id)
            .single();

        if (verifyError) {
            console.log('❌ Error en verificación:', verifyError.message);
        } else {
            console.log('✅ Estado actual en base de datos:');
            console.log(`   - Status: ${verificacion.last_verification_status}`);
            console.log(`   - Platform: ${verificacion.platform}`);
            console.log(`   - Last Verified: ${verificacion.last_verified}`);
        }

    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

// Ejecutar el script
actualizarRadioSomos().catch(console.error);