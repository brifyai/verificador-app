#!/usr/bin/env node

/**
 * Script para probar contraseñas de los usuarios admin existentes
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta configuración de Supabase');
  console.error('Verifica que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas');
  process.exit(1);
}

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testAdminPasswords() {
  console.log(`${colors.blue}🔑 Probando contraseñas de usuarios admin...${colors.reset}\n`);

  try {
    // Crear cliente de Supabase con Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obtener usuarios admin
    console.log(`${colors.yellow}Obteniendo usuarios administradores...${colors.reset}`);
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, password, role, active')
      .eq('role', 'ADMIN');

    if (error) {
      console.error(`${colors.red}❌ Error obteniendo usuarios:${colors.reset}`);
      console.error(error);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log(`${colors.red}❌ No se encontraron usuarios administradores${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Encontrados ${users.length} usuarios administradores${colors.reset}\n`);

    // Probar contraseñas comunes
    const commonPasswords = ['admin', 'admin123', 'password', '123456', 'administrador', 'root'];
    
    for (const user of users) {
      console.log(`${colors.blue}👤 Usuario: ${user.email} (${user.name})${colors.reset}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Activo: ${user.active}`);
      
      let passwordFound = false;
      
      // Probar contraseñas comunes
      for (const password of commonPasswords) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log(`${colors.green}   ✅ Contraseña encontrada: "${password}"${colors.reset}`);
          passwordFound = true;
          break;
        }
      }
      
      if (!passwordFound) {
        console.log(`${colors.red}   ❌ Ninguna contraseña común funciona${colors.reset}`);
        console.log(`${colors.yellow}   🔍 Hash de contraseña: ${user.password.substring(0, 20)}...${colors.reset}`);
        
        // Intentar crear un hash con "admin" para comparar
        const adminHash = await bcrypt.hash('admin', 10);
        console.log(`${colors.yellow}   🔍 Hash de "admin": ${adminHash.substring(0, 20)}...${colors.reset}`);
        
        if (user.password === adminHash) {
          console.log(`${colors.green}   ✅ La contraseña es "admin"${colors.reset}`);
        }
      }
      
      console.log('');
    }

    console.log(`${colors.blue}💡 Sugerencias:${colors.reset}`);
    console.log(`${colors.yellow}   - Si ninguna contraseña funciona, puedes resetearla con el script reset-admin-password.js${colors.reset}`);
    console.log(`${colors.yellow}   - O puedes crear un nuevo usuario admin con create-admin-user.js${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Error inesperado:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar script
testAdminPasswords().catch(console.error);