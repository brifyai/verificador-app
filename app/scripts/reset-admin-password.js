require('dotenv').config();
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  console.log('🔑 Restableciendo contraseña del administrador...');
  console.log('===============================================');
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    // 1. Obtener el usuario actual
    console.log('🔍 Obteniendo usuario administrador...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.admin@verificador.com`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log('❌ Error obteniendo usuario:', await response.text());
      return;
    }
    
    const users = await response.json();
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:', user.email);
    console.log('   ID:', user.id);
    console.log('   Active:', user.active);
    
    // 2. Generar nuevo hash de contraseña
    console.log('\n🔐 Generando nuevo hash de contraseña...');
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Hash generado correctamente');
    
    // 3. Actualizar la contraseña
    console.log('\n🔄 Actualizando contraseña en la base de datos...');
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        password: hashedPassword
      })
    });
    
    if (!updateResponse.ok) {
      console.log('❌ Error actualizando contraseña:', await updateResponse.text());
      return;
    }
    
    const updatedUser = await updateResponse.json();
    console.log('✅ Contraseña actualizada exitosamente');
    
    // 4. Verificar la contraseña
    console.log('\n🧪 Verificando la nueva contraseña...');
    const isValid = await bcrypt.compare(newPassword, updatedUser[0].password);
    console.log('✅ Verificación de contraseña:', isValid ? 'EXITOSA' : 'FALLÓ');
    
    console.log('\n🎉 ¡CONTRASEÑA RESTABLECIDA!');
    console.log('📋 Credenciales de acceso:');
    console.log('📧 Email: admin@verificador.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 URL: http://localhost:3000/auth/signin');
    
    console.log('\n🚀 Ahora puedes iniciar sesión correctamente');
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
  }
}

resetAdminPassword();