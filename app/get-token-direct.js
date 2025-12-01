const axios = require('axios');

// Configuración de Supabase desde las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

async function getTokenDirect() {
  try {
    console.log('Intentando obtener token usando Supabase directo...');
    
    // Intentar login directo con Supabase Auth
    const response = await axios.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      email: 'admin@example.com',
      password: 'Admin@123456!'
    }, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Token obtenido exitosamente:', response.data.access_token);
    return response.data.access_token;
    
  } catch (error) {
    console.log('❌ Error al obtener token:', error.response?.data || error.message);
    
    // Si el usuario no existe, intentar crearlo
    if (error.response?.data?.error === 'Invalid login credentials') {
      console.log('Usuario no existe, intentando crearlo...');
      
      try {
        // Crear usuario
        const createResponse = await axios.post(`${SUPABASE_URL}/auth/v1/signup`, {
          email: 'admin@example.com',
          password: 'Admin@123456!',
          data: {
            name: 'Admin',
            role: 'admin'
          }
        }, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Usuario creado:', createResponse.data);
        
        // Ahora hacer login
        const loginResponse = await axios.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          email: 'admin@example.com',
          password: 'Admin@123456!'
        }, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Token obtenido después de crear usuario:', loginResponse.data.access_token);
        return loginResponse.data.access_token;
        
      } catch (createError) {
        console.log('❌ Error al crear usuario:', createError.response?.data || createError.message);
      }
    }
    
    return null;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  getTokenDirect();
}

module.exports = { getTokenDirect };