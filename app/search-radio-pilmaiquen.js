// Buscar específicamente Radio Pilmaiquen o Futaleufu
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG9uZGF2ZXJpZmljYWRhLmNvbSIsInVzZXJJZCI6ImFkbWluLTEiLCJpYXQiOjE3MzMwNTI1MDAsImV4cCI6MTczNTY0NDUwMH0.dOjvzqU-ETe0ZVlV0NqKmfIBZG1tQfA1j0u7j6b0mJ8';

async function searchRadioByName() {
    console.log('🔍 Buscando Radio Pilmaiquen o Futaleufu...');
    
    try {
        // Buscar por nombre con diferentes variaciones
        const searchTerms = ['pilmaiquen', 'futaleufu'];
        
        for (const term of searchTerms) {
            console.log(`\n📡 Buscando radios con nombre que contiene: ${term}`);
            
            const response = await axios.get(`${API_BASE}/radios-direct`, {
                params: {
                    name: `ilike.*${term}*`,
                    limit: 100
                },
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                }
            });
            
            const radios = response.data;
            console.log(`   Encontradas ${radios.length} radios`);
            
            if (radios.length > 0) {
                console.log('\n📻 Radios encontradas:');
                radios.forEach(radio => {
                    console.log(`   - ID: ${radio.id}`);
                    console.log(`     Nombre: ${radio.name}`);
                    console.log(`     Región: ${radio.region}`);
                    console.log(`     URL: ${radio.stream_url}`);
                    console.log(`     Estado: ${radio.status}`);
                    console.log(`     Última verificación: ${radio.last_verification}`);
                    console.log('');
                });
                
                return radios;
            }
        }
        
        console.log('❌ No se encontraron radios con esos nombres');
        return [];
        
    } catch (error) {
        console.error('❌ Error al buscar radios:', error.response?.data || error.message);
        return [];
    }
}

async function searchByURL() {
    console.log('\n🔍 Buscando radios con URL de chiloestreaming.com...');
    
    try {
        const response = await axios.get(`${API_BASE}/radios-direct`, {
            params: {
                stream_url: 'ilike.*chiloestreaming.com*',
                limit: 100
            },
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });
        
        const radios = response.data;
        console.log(`   Encontradas ${radios.length} radios con chiloestreaming.com`);
        
        if (radios.length > 0) {
            console.log('\n📻 Radios encontradas:');
            radios.forEach(radio => {
                console.log(`   - ID: ${radio.id}`);
                console.log(`     Nombre: ${radio.name}`);
                console.log(`     Región: ${radio.region}`);
                console.log(`     URL: ${radio.stream_url}`);
                console.log(`     Estado: ${radio.status}`);
                console.log(`     Última verificación: ${radio.last_verification}`);
                console.log('');
            });
            
            return radios;
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ Error al buscar por URL:', error.response?.data || error.message);
        return [];
    }
}

async function main() {
    console.log('🎯 Búsqueda específica de Radio Pilmaiquen');
    console.log('========================================');
    
    // Buscar por nombre
    const nameResults = await searchRadioByName();
    
    // Buscar por URL
    const urlResults = await searchByURL();
    
    // Combinar resultados
    const allResults = [...nameResults, ...urlResults];
    
    if (allResults.length === 0) {
        console.log('❌ No se encontró Radio Pilmaiquen en la base de datos');
        console.log('\n💡 Sugerencias:');
        console.log('   - Verifica el nombre exacto de la radio');
        console.log('   - Busca en el panel de administración web');
        console.log('   - Contacta al administrador del sistema');
    } else {
        console.log(`✅ Se encontraron ${allResults.length} radios relacionadas`);
    }
}

main().catch(console.error);