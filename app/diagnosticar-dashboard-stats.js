#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar el problema de las estadísticas del dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DE ESTADÍSTICAS DEL DASHBOARD');
console.log('===========================================\n');

// 1. Verificar el contenido actual del archivo supabase-direct.js
console.log('1. 📄 Verificando archivo supabase-direct.js...');
const supabaseDirectPath = path.join(__dirname, 'lib', 'supabase-direct.js');

if (fs.existsSync(supabaseDirectPath)) {
    const content = fs.readFileSync(supabaseDirectPath, 'utf8');
    console.log('✅ Archivo encontrado');
    
    // Buscar la función calculateRadioStatusStats
    const functionMatch = content.match(/calculateRadioStatusStats\s*\([^)]*\)\s*{[\s\S]*?^}/m);
    if (functionMatch) {
        console.log('✅ Función calculateRadioStatusStats encontrada:');
        console.log(functionMatch[0]);
    } else {
        console.log('❌ Función calculateRadioStatusStats NO encontrada');
    }
} else {
    console.log('❌ Archivo supabase-direct.js NO encontrado');
}

console.log('\n2. 🔍 Verificando estructura de campos en la base de datos...');

// 2. Verificar si los campos existen en la base de datos
const testScript = `
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

if (supabaseUrl === 'https://your-project.supabase.co' || !supabaseKey) {
    console.log('❌ Variables de entorno no configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Consultando estructura de la tabla radios...');
        
        // Obtener una muestra de radios para ver qué campos existen
        const { data: radios, error } = await supabase
            .from('radios')
            .select('*')
            .limit(5);
            
        if (error) {
            console.log('❌ Error consultando radios:', error.message);
            return;
        }
        
        if (!radios || radios.length === 0) {
            console.log('❌ No se encontraron radios en la base de datos');
            return;
        }
        
        console.log('✅ Radios encontrados:', radios.length);
        console.log('📊 Campos disponibles en la primera radio:');
        const firstRadio = radios[0];
        Object.keys(firstRadio).forEach(key => {
            const value = firstRadio[key];
            console.log(\`  - \${key}: \${typeof value} = \${value}\`);
        });
        
        // Verificar campos específicos que necesitamos
        console.log('\n🔍 Verificando campos específicos:');
        const requiredFields = ['last_verification_status', 'isActive', 'status', 'last_verified_at'];
        requiredFields.forEach(field => {
            const exists = field in firstRadio;
            console.log(\`  - \${field}: \${exists ? '✅' : '❌'}\`);
        });
        
        // Contar radios por estado de verificación
        console.log('\n📊 Contando radios por estado de verificación...');
        const { data: allRadios, error: countError } = await supabase
            .from('radios')
            .select('last_verification_status, isActive, status');
            
        if (countError) {
            console.log('❌ Error contando radios:', countError.message);
            return;
        }
        
        if (allRadios) {
            console.log('✅ Total de radios:', allRadios.length);
            
            // Contar por last_verification_status
            const verificationCounts = {};
            allRadios.forEach(radio => {
                const status = radio.last_verification_status || 'null';
                verificationCounts[status] = (verificationCounts[status] || 0) + 1;
            });
            
            console.log('📊 Conteo por last_verification_status:');
            Object.entries(verificationCounts).forEach(([status, count]) => {
                console.log(\`  - \${status}: \${count}\`);
            });
            
            // Contar por isActive
            const activeCounts = { true: 0, false: 0 };
            allRadios.forEach(radio => {
                const isActive = radio.isActive;
                if (isActive === true) activeCounts.true++;
                else if (isActive === false) activeCounts.false++;
            });
            
            console.log('📊 Conteo por isActive:');
            console.log(\`  - true: \${activeCounts.true}\`);
            console.log(\`  - false: \${activeCounts.false}\`);
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

checkDatabaseStructure();
`;

fs.writeFileSync('test-db-structure.js', testScript);
console.log('✅ Script de prueba creado: test-db-structure.js');
console.log('   Ejecuta: node test-db-structure.js');

console.log('\n3. 🔍 Verificando endpoint de estadísticas...');

// 3. Probar el endpoint directamente
const endpointTestScript = `
const http = require('http');

console.log('🔍 Probando endpoint /api/dashboard/stats-direct...');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dashboard/stats-direct',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    console.log(\`Status: \${res.statusCode}\`);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 Respuesta completa:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (error) {
            console.log('❌ Error parseando JSON:', error.message);
            console.log('📄 Respuesta raw:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Error de conexión:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
});

req.end();
`;

fs.writeFileSync('test-endpoint.js', endpointTestScript);
console.log('✅ Script de prueba creado: test-endpoint.js');
console.log('   Ejecuta: node test-endpoint.js');

console.log('\n4. 📋 RESUMEN DE DIAGNÓSTICO');
console.log('===========================');
console.log('Para diagnosticar el problema, ejecuta estos comandos:');
console.log('');
console.log('1. Verificar estructura de BD:');
console.log('   node test-db-structure.js');
console.log('');
console.log('2. Probar endpoint directamente:');
console.log('   node test-endpoint.js');
console.log('');
console.log('3. Verificar logs del servidor:');
console.log('   Revisa la terminal donde está ejecutándose npm run dev');
console.log('');
console.log('4. Limpiar cache del navegador:');
console.log('   - Ctrl+Shift+R (Chrome)');
console.log('   - Cmd+Shift+R (Safari)');
console.log('   - Ctrl+F5 (Firefox)');