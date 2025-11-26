// Script para ejecutar SQL en Supabase usando credenciales directas
const fs = require('fs');
const path = require('path');

// Credenciales de Supabase
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

async function executeSQLInSupabase() {
  try {
    console.log('🚀 Conectando a Supabase...');
    console.log(`📡 URL: ${SUPABASE_URL}`);
    
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create-all-supabase-tables-complete.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Error: No se encontró el archivo SQL');
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 SQL leído: ${sql.length} caracteres`);
    console.log('📊 Contenido SQL (primeras 500 chars):');
    console.log(sql.substring(0, 500) + '...');
    
    // Ejecutar SQL usando Supabase API
    console.log('📡 Enviando SQL a Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        sql: sql,
        params: {}
      })
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log('✅ SQL ejecutado exitosamente en Supabase');
      console.log('📊 Resultado:', result);
      
      // Verificar tablas creadas
      console.log('🔍 Verificando tablas creadas...');
      await verifyTables();
      
    } else {
      console.error('❌ Error ejecutando SQL:', response.status, response.statusText);
      console.error('📄 Respuesta:', result);
      
      // Si es error de autenticación, intentar método alternativo
      if (response.status === 401 || result.includes('credentials')) {
        console.log('🔐 Intentando método alternativo...');
        await executeSQLAlternative();
      } else {
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📄 Stack:', error.stack);
    process.exit(1);
  }
}

async function executeSQLAlternative() {
  try {
    console.log('🔄 Método alternativo: Ejecutando SQL por bloques...');
    
    const sqlFile = path.join(__dirname, 'create-all-supabase-tables-complete.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir SQL en comandos individuales
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));
    
    console.log(`📊 Encontrados ${commands.length} comandos SQL`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.length < 10) continue; // Saltar comandos vacíos
      
      console.log(`🔨 Ejecutando comando ${i + 1}/${commands.length}...`);
      console.log(`📄 ${command.substring(0, 60)}...`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            sql: command + ';',
            params: {}
          })
        });

        if (response.ok) {
          console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        } else {
          const error = await response.text();
          console.warn(`⚠️  Comando ${i + 1} falló (puede ser normal):`, error.substring(0, 100));
        }
        
        // Pequeña pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn(`⚠️  Error en comando ${i + 1}:`, error.message);
      }
    }
    
    console.log('✅ Todos los comandos SQL procesados');
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Error en método alternativo:', error.message);
  }
}

async function verifyTables() {
  try {
    console.log('🔍 Verificando tablas creadas...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const tables = await response.json();
      console.log('✅ Tablas en la base de datos:');
      tables.forEach(table => console.log(`  - ${table.table_name}`));
      
      const expectedTables = [
        'users', 'radios', 'phrases', 'phrase_variants', 'monitoring_sessions',
        'captures', 'audios', 'detections', 'api_configurations', 'radio_pricing_rules',
        'reports', 'jobs', 'notifications', 'cache', 'system_logs',
        'billing_profiles', 'invoices', 'invoice_line_items', 'subscriptions', 'payment_methods'
      ];
      
      const missingTables = expectedTables.filter(
        expected => !tables.some(t => t.table_name === expected)
      );
      
      if (missingTables.length > 0) {
        console.warn('⚠️  Tablas faltantes:', missingTables);
      } else {
        console.log('🎉 ¡Todas las tablas han sido creadas exitosamente!');
      }
    } else {
      console.warn('⚠️  No se pudo verificar tablas (puede ser normal)');
    }
  } catch (error) {
    console.warn('⚠️  Error verificando tablas:', error.message);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  executeSQLInSupabase().catch(console.error);
}

module.exports = { executeSQLInSupabase };