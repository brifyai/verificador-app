require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function createAdminUser() {
  console.log('🚀 Creando usuario administrador en Supabase...');
  console.log('URL:', SUPABASE_URL);
  console.log('Service Key disponible:', !!SUPABASE_SERVICE_KEY);
  console.log('===============================================');
  
  try {
    // Intentar crear usuario con el service key (más privilegios)
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    
    // Primero verificar si el usuario ya existe
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&email=eq.admin@ondaverificada.com`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (checkResponse.ok) {
      const existingUsers = await checkResponse.json();
      if (existingUsers.length > 0) {
        console.log('✅ El usuario admin ya existe');
        return;
      }
    }
    
    // Crear el usuario administrador
    const adminData = {
      id: 'admin-' + Date.now(),
      email: 'admin@ondaverificada.com',
      name: 'Administrador',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // bcrypt hash para 'password'
      role: 'ADMIN',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adminData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Contraseña: password');
      console.log('📝 ID:', result[0]?.id);
    } else {
      const error = await response.text();
      console.log('❌ Error creando usuario:', error);
      
      // Si falla con service key, intentar con método alternativo
      if (key === SUPABASE_SERVICE_KEY) {
        console.log('\n🔄 Intentando con método alternativo...');
        await createUserViaAuth();
      }
    }
  } catch (error) {
    console.log('❌ Error en la conexión:', error.message);
    console.log('\n💡 Intentando método alternativo...');
    await createUserViaAuth();
  }
}

async function createUserViaAuth() {
  try {
    // Intentar crear usuario a través del servicio de autenticación
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'admin@ondaverificada.com',
        password: 'admin123',
        data: {
          name: 'Administrador',
          role: 'ADMIN'
        }
      })
    });
    
    if (authResponse.ok) {
      console.log('✅ Usuario creado exitosamente vía autenticación');
      console.log('📧 Email: admin@ondaverificada.com');
      console.log('🔑 Contraseña: admin123');
    } else {
      const error = await authResponse.text();
      console.log('❌ Error en autenticación:', error);
    }
  } catch (error) {
    console.log('❌ Error en método alternativo:', error.message);
  }
}

createAdminUser();