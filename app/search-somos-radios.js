const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijm9xskmiuebmqbmrww.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pam05eHNrbWl1ZWJtcWJtcnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5OTY4MzUsImV4cCI6MjA0NjU3MjgzNX0.jqQ4h1lEfR8q5jJ9vR8q5jJ9vR8q5jJ9vR8q5jJ9vR8q5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchSomosRadios() {
    console.log('🔍 Buscando radios de Somos/Somos FM en el sistema...\n');
    
    try {
        // Buscar por nombre
        const { data: nameData, error: nameError } = await supabase
            .from('radios')
            .select('*')
            .ilike('name', '%somos%');
            
        if (nameError) {
            console.log('❌ Error buscando por nombre:', nameError.message);
        } else if (nameData && nameData.length > 0) {
            console.log(`✅ Encontradas ${nameData.length} radios con "somos" en el nombre:`);
            nameData.forEach(radio => {
                console.log(`\n📻 ${radio.name}`);
                console.log(`   ID: ${radio.id}`);
                console.log(`   URL: ${radio.stream_url}`);
                console.log(`   Región: ${radio.region}`);
                console.log(`   Estado: ${radio.status}`);
                console.log(`   Última verificación: ${radio.last_verification_status}`);
                console.log(`   Verificado: ${radio.last_verified_at}`);
            });
        }
        
        // Buscar por URL (tecnoera.com)
        const { data: urlData, error: urlError } = await supabase
            .from('radios')
            .select('*')
            .ilike('stream_url', '%tecnoera.com%');
            
        if (urlError) {
            console.log('❌ Error buscando por URL:', urlError.message);
        } else if (urlData && urlData.length > 0) {
            console.log(`\n✅ Encontradas ${urlData.length} radios con "tecnoera.com" en la URL:`);
            urlData.forEach(radio => {
                console.log(`\n📻 ${radio.name}`);
                console.log(`   ID: ${radio.id}`);
                console.log(`   URL: ${radio.stream_url}`);
                console.log(`   Región: ${radio.region}`);
                console.log(`   Estado: ${radio.status}`);
                console.log(`   Última verificación: ${radio.last_verification_status}`);
                console.log(`   Verificado: ${radio.last_verified_at}`);
            });
        }
        
        // Buscar por región (Petorca)
        const { data: regionData, error: regionError } = await supabase
            .from('radios')
            .select('*')
            .ilike('region', '%petorca%');
            
        if (regionError) {
            console.log('❌ Error buscando por región:', regionError.message);
        } else if (regionData && regionData.length > 0) {
            console.log(`\n✅ Encontradas ${regionData.length} radios en la región Petorca:`);
            regionData.forEach(radio => {
                console.log(`\n📻 ${radio.name}`);
                console.log(`   ID: ${radio.id}`);
                console.log(`   URL: ${radio.stream_url}`);
                console.log(`   Región: ${radio.region}`);
                console.log(`   Estado: ${radio.status}`);
                console.log(`   Última verificación: ${radio.last_verification_status}`);
                console.log(`   Verificado: ${radio.last_verified_at}`);
            });
        }
        
        // Buscar específicamente Radio Somos de Petorca
        const { data: specificData, error: specificError } = await supabase
            .from('radios')
            .select('*')
            .or('name.ilike.%somos fm%,name.ilike.%radio somos%,name.ilike.%somos petorca%');
            
        if (specificError) {
            console.log('❌ Error en búsqueda específica:', specificError.message);
        } else if (specificData && specificData.length > 0) {
            console.log(`\n✅ Encontradas ${specificData.length} radios con variaciones de "Radio Somos":`);
            specificData.forEach(radio => {
                console.log(`\n📻 ${radio.name}`);
                console.log(`   ID: ${radio.id}`);
                console.log(`   URL: ${radio.stream_url}`);
                console.log(`   Región: ${radio.region}`);
                console.log(`   Estado: ${radio.status}`);
                console.log(`   Última verificación: ${radio.last_verification_status}`);
                console.log(`   Verificado: ${radio.last_verified_at}`);
                console.log(`   Plataforma: ${radio.platform || 'No especificada'}`);
            });
        }
        
        // Si no se encontraron resultados
        if ((!nameData || nameData.length === 0) && 
            (!urlData || urlData.length === 0) && 
            (!regionData || regionData.length === 0) &&
            (!specificData || specificData.length === 0)) {
            console.log('🔍 No se encontraron radios que coincidan con los criterios de búsqueda.');
            console.log('\n💡 Sugerencias:');
            console.log('- Verifica que la radio esté registrada en el sistema');
            console.log('- Intenta buscar con diferentes términos (Petorca, Somos, FM, etc.)');
            console.log('- Revisa que el URL contenga "tecnoera.com"');
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

// Ejecutar búsqueda
searchSomosRadios();