#!/usr/bin/env node

// Script para crear usuario admin usando fetch directo con credenciales de entorno

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.error('URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('ANON KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  console.error('SERVICE KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const API_BASE = `${SUPABASE_URL}/rest/v1`;

async function createAdminFetch() {
  console.log('🔐 Creando usuario administrador usando fetch directo...\n');
  
  try {
    // Verificar conexión
    console.log('📡 Verificando conexión con Supabase...');
    const response = await fetch(`${API_BASE}/radios?select=count&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
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
    const existingUserResponse = await fetch(
      `${API_BASE}/users?email=eq.${encodeURIComponent(adminUser.email)}&select=id`, 
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!existingUserResponse.ok) {
      throw new Error(`Error al verificar usuario: ${existingUserResponse.status}`);
    }

    const existingUsers = await existingUserResponse.json();
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  El usuario admin ya existe con ID:', existingUsers[0].id);
      console.log('✅ Puedes usar las credenciales:');
      console.log('   Email: admin@radiodetection.cl');
      console.log('   Contraseña: Admin123!');
      return;
    }

    // Crear el usuario
    console.log('📝 Creando nuevo usuario administrador...');
    
    const createResponse = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adminUser)
    });

    if (!createResponse.ok) {
      throw new Error(`Error ${createResponse.status}: ${await createResponse.text()}`);
    }

    const createdUsers = await createResponse.json();
    const createdUser = createdUsers[0];
    
    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email: admin@radiodetection.cl');
    console.log('   Contraseña: Admin123!');
    console.log('   Rol: admin');
    console.log(`   ID: ${createdUser.id}`);
    console.log('\n🎯 Ahora puedes iniciar sesión con estas credenciales.');

  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  createAdminFetch().catch(console.error);
}