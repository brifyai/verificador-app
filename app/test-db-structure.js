
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
            console.log(`  - ${key}: ${typeof value} = ${value}`);
        });
        
        // Verificar campos específicos que necesitamos
        console.log('
🔍 Verificando campos específicos:');
        const requiredFields = ['last_verification_status', 'isActive', 'status', 'last_verified_at'];
        requiredFields.forEach(field => {
            const exists = field in firstRadio;
            console.log(`  - ${field}: ${exists ? '✅' : '❌'}`);
        });
        
        // Contar radios por estado de verificación
        console.log('
📊 Contando radios por estado de verificación...');
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
                console.log(`  - ${status}: ${count}`);
            });
            
            // Contar por isActive
            const activeCounts = { true: 0, false: 0 };
            allRadios.forEach(radio => {
                const isActive = radio.isActive;
                if (isActive === true) activeCounts.true++;
                else if (isActive === false) activeCounts.false++;
            });
            
            console.log('📊 Conteo por isActive:');
            console.log(`  - true: ${activeCounts.true}`);
            console.log(`  - false: ${activeCounts.false}`);
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

checkDatabaseStructure();
