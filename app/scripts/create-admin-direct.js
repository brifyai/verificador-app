#!/usr/bin/env node

// Script para crear usuario admin usando el cliente directo de Supabase

const { SupabaseDirectClient } = require('../lib/supabase-direct');

async function createAdminDirect() {
  console.log('🔐 Creando usuario administrador usando Supabase directo...\n');
  
  try {
    // Crear cliente directo de Supabase
    const supabase = new SupabaseDirectClient();
    
    // Verificar conexión
    console.log('📡 Verificando conexión con Supabase...');
    const testConnection = await supabase.get('radios?select=count&limit=1');
    if (!testConnection) {
      throw new Error('No se pudo conectar a Supabase');
    }
    console.log('✅ Conexión exitosa\n');

    // Datos del usuario admin
    const adminUser = {
      email: 'admin@radiodetection.cl',
      password: 'Admin123!',
      name: 'Administrador',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario admin ya existe...');
    const existingUser = await supabase.get(`users?email=eq.${adminUser.email}&select=id`);
    
    if (existingUser && existingUser.length > 0) {
      console.log('⚠️  El usuario admin ya existe con ID:', existingUser[0].id);
      console.log('✅ Puedes usar las credenciales:');
      console.log('   Email: admin@radiodetection.cl');
      console.log('   Contraseña: Admin123!');
      return;
    }

    // Crear el usuario
    console.log('📝 Creando nuevo usuario administrador...');
    const createdUser = await supabase.post('users', adminUser);
    
    if (createdUser) {
      console.log('✅ Usuario administrador creado exitosamente!');
      console.log('\n📋 Credenciales de acceso:');
      console.log('   Email: admin@radiodetection.cl');
      console.log('   Contraseña: Admin123!');
      console.log('   Rol: admin');
      console.log(`   ID: ${createdUser.id}`);
      console.log('\n🎯 Ahora puedes iniciar sesión con estas credenciales.');
    } else {
      throw new Error('No se pudo crear el usuario');
    }

  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  createAdminDirect().catch(console.error);
}