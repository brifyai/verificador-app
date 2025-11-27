// Script simple para crear usuario admin usando endpoint API
require('dotenv').config();

async function createAdminSimple() {
  console.log('👤 Creando usuario administrador via endpoint API...');
  console.log('===================================================');
  
  try {
    // Verificar si ya existe
    console.log('🔍 Verificando si admin ya existe...');
    const checkResponse = await fetch('http://localhost:3000/api/auth/setup-admin');
    const checkData = await checkResponse.json();
    
    if (checkData.exists) {
      console.log('✅ Usuario admin ya existe');
      console.log('📧 Email: admin@verificador.com');
      console.log('🔑 Password: admin123');
      console.log('\n🚀 Puedes iniciar sesión ahora');
      return;
    }
    
    // Crear usuario admin
    console.log('👤 Creando usuario administrador...');
    
    const createResponse = await fetch('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('📋 Datos:');
      console.log('   ID:', createData.user.id);
      console.log('   Email:', createData.user.email);
      console.log('   Nombre:', createData.user.name);
      console.log('   Rol:', createData.user.role);
      console.log('');
      console.log('🔑 CREDENCIALES:');
      console.log('   Email: admin@verificador.com');
      console.log('   Password: admin123');
      console.log('');
      console.log('🚀 LISTO PARA INICIAR SESIÓN!');
      console.log('   URL: http://localhost:3000/auth/signin');
    } else {
      console.log('❌ Error:', createData.error);
      console.log('💡 Detalles:', createData.details || 'Sin detalles');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 SOLUCIÓN:');
    console.log('1. Asegúrate que el servidor esté corriendo: npm run dev');
    console.log('2. Prueba el endpoint manual:');
    console.log('   GET: http://localhost:3000/api/auth/setup-admin');
    console.log('   POST: http://localhost:3000/api/auth/setup-admin');
  }
}

// Ejecutar
createAdminSimple().catch(console.error);