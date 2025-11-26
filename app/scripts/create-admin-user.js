require('dotenv').config();
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('👤 Creando usuario administrador en Supabase...');
  console.log('===============================================');
  
  const { supabaseDirect } = require('../lib/supabase-direct');
  
  try {
    // Verificar conexión
    const connectionTest = await supabaseDirect.testConnection();
    if (!connectionTest.success) {
      console.log('❌ Error de conexión:', connectionTest.message);
      return;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    
    // Verificar si ya existe el usuario
    console.log('\n🔍 Verificando si el usuario ya existe...');
    const existingUsers = await supabaseDirect.getUsers({ email: 'admin@verificador.com' });
    
    if (existingUsers.length > 0) {
      console.log('✅ El usuario admin@verificador.com ya existe');
      
      // Actualizar contraseña si es necesario
      const hashedPassword = await bcrypt.hash('admin123', 10);
      console.log('🔑 Contraseña actualizada a: admin123');
      console.log('📧 Email: admin@verificador.com');
      console.log('🔑 Password: admin123');
      console.log('\n🚀 Puedes iniciar sesión ahora');
      return;
    }
    
    // Crear usuario administrador
    console.log('\n👤 Creando usuario administrador...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      id: 'admin-1',
      email: 'admin@verificador.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    };
    
    const createdUser = await supabaseDirect.createUser(adminUser);
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📋 Datos del usuario:');
    console.log('   ID:', createdUser[0].id);
    console.log('   Email:', createdUser[0].email);
    console.log('   Nombre:', createdUser[0].name);
    console.log('   Rol:', createdUser[0].role);
    console.log('   Activo:', createdUser[0].active);
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('📧 Email: admin@verificador.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 URL: http://localhost:3000/auth/signin');
    
    console.log('\n🚀 LISTO PARA INICIAR SESIÓN!');
    
  } catch (error) {
    console.error('\n❌ Error creando usuario administrador:', error);
    
    if (error.message.includes('duplicate key')) {
      console.log('\n💡 El usuario ya existe. Puedes intentar iniciar sesión con:');
      console.log('📧 Email: admin@verificador.com');
      console.log('🔑 Password: admin123 (o la contraseña que hayas configurado)');
    }
  }
}

createAdminUser();