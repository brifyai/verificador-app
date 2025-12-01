const axios = require('axios');

async function checkExistingUsers() {
  try {
    console.log('Verificando usuarios existentes en el sistema...');
    
    // Intentar obtener usuarios del endpoint público
    const response = await axios.get('http://localhost:3000/api/users');
    console.log('Usuarios encontrados:', response.data);
    
  } catch (error) {
    console.log('No se pudo obtener lista de usuarios, intentando crear uno...');
    
    try {
      // Intentar crear usuario admin con contraseña segura
      const createResponse = await axios.post('http://localhost:3000/api/auth/register', {
        email: 'admin@example.com',
        password: 'Admin@123456!',
        name: 'Admin',
        role: 'admin'
      });
      
      console.log('✅ Usuario admin creado:', createResponse.data);
      
      // Ahora intentar login
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login-direct', {
        email: 'admin@example.com',
        password: 'Admin@123456!'
      });
      
      console.log('✅ Token obtenido:', loginResponse.data.token);
      
    } catch (registerError) {
      console.log('❌ Error al crear usuario:', registerError.response?.data || registerError.message);
    }
  }
}

checkExistingUsers();