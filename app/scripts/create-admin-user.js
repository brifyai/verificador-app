#!/usr/bin/env node

/**
 * Script para crear un usuario administrador directamente en la tabla users de Supabase
 * Este script crea un usuario admin con email: admin@admin.com y password: admin
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

async function createAdminUser() {
  console.log(`${colors.blue}🔧 Creando usuario administrador en Supabase...${colors.reset}`);
  console.log(`${colors.blue}URL: ${supabaseUrl}${colors.reset}\n`);

  try {
    // Crear cliente de Supabase con Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar conexión
    console.log(`${colors.yellow}Verificando conexión con Supabase...${colors.reset}`);
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      console.error(`${colors.red}❌ Error conectando a Supabase:${colors.reset}`);
      console.error(testError);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Conexión con Supabase establecida${colors.reset}`);

    // Verificar si ya existe el usuario admin
    console.log(`${colors.yellow}Verificando si existe el usuario admin...${colors.reset}`);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, name, role, active')
      .eq('email', 'admin@admin.com')
      .single();

    if (existingUser) {
      console.log(`${colors.yellow}⚠️  El usuario admin ya existe:${colors.reset}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Nombre: ${existingUser.name}`);
      console.log(`   Rol: ${existingUser.role}`);
      console.log(`   Activo: ${existingUser.active}`);
      
      // Actualizar contraseña si el usuario existe
      console.log(`${colors.yellow}Actualizando contraseña...${colors.reset}`);
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error(`${colors.red}❌ Error actualizando usuario:${colors.reset}`);
        console.error(updateError);
        process.exit(1);
      }

      console.log(`${colors.green}✅ Usuario admin actualizado exitosamente${colors.reset}`);
      console.log(`${colors.green}✅ Credenciales: admin@admin.com / admin${colors.reset}`);
      return;
    }

    // Crear nuevo usuario admin
    console.log(`${colors.yellow}Creando nuevo usuario administrador...${colors.reset}`);
    
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const adminUser = {
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([adminUser])
      .select()
      .single();

    if (insertError) {
      console.error(`${colors.red}❌ Error creando usuario:${colors.reset}`);
      console.error(insertError);
      process.exit(1);
    }

    console.log(`${colors.green}✅ Usuario administrador creado exitosamente${colors.reset}`);
    console.log(`${colors.green}✅ Credenciales: admin@admin.com / admin${colors.reset}`);
    console.log(`\n${colors.blue}📋 Detalles del usuario:${colors.reset}`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nombre: ${newUser.name}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log(`   Activo: ${newUser.active}`);

  } catch (error) {
    console.error(`${colors.red}❌ Error inesperado:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar script
createAdminUser().catch(console.error);