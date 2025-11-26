// Script para ejecutar SQL en Supabase usando su API
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

async function executeSQL() {
  try {
    console.log('🚀 Conectando a Supabase...');
    console.log(`📡 URL: ${SUPABASE_URL}`);
    
    // Leer el archivo SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'create-all-supabase-tables-complete.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Error: No se encontró el archivo SQL');
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 SQL leído: ${sql.length} caracteres`);
    
    // Ejecutar SQL usando Supabase API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SQL ejecutado exitosamente en Supabase');
      console.log('📊 Resultado:', result);
    } else {
      console.error('❌ Error ejecutando SQL:', result);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  executeSQL().catch(console.error);
}

module.exports = { executeSQL };