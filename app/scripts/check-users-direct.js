require('dotenv').config();

async function checkUsersDirect() {
  console.log('🔍 Verificando usuarios en Supabase directamente...');
  console.log('===============================================');
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Configuración:');
  console.log('URL:', SUPABASE_URL);
  console.log('API Key:', SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  try {
    // Consulta directa a la API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('\n📡 Respuesta API:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error:', error);
      return;
    }
    
    const users = await response.json();
    console.log('✅ Usuarios encontrados:', users.length);
    
    if (users.length > 0) {
      console.log('\n📋 Lista de usuarios:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Active: ${user.active}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️ No hay usuarios en la base de datos');
      console.log('🔧 Creando usuario administrador...');
      
      // Crear usuario admin
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: 'admin-1',
          email: 'admin@verificador.com',
          name: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          active: true
        })
      });
      
      if (createResponse.ok) {
        const createdUser = await createResponse.json();
        console.log('✅ Usuario administrador creado:', createdUser[0].email);
        console.log('🔑 Credenciales:');
        console.log('   Email: admin@verificador.com');
        console.log('   Password: admin123');
      } else {
        const error = await createResponse.text();
        console.log('❌ Error creando usuario:', error);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
  }
}

checkUsersDirect();