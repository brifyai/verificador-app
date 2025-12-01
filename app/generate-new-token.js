// Script para generar un nuevo token JWT válido
const crypto = require('crypto');

// Clave secreta desde el entorno
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Función para crear un token JWT simple
function createJWT(payload) {
  // Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Payload con expiración de 24 horas
  const payloadWithExp = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  
  // Codificar header y payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64url');
  
  // Crear firma
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Generar token para admin con la estructura esperada por el backend
const adminToken = createJWT({
  id: 'admin-1',
  email: 'admin@verificador.com',
  name: 'Administrador',
  role: 'admin'
});

console.log('🔑 Nuevo token JWT generado:');
console.log(adminToken);
console.log('\n📋 Payload del token:');
console.log(JSON.stringify({
  id: 'admin-1',
  email: 'admin@verificador.com',
  name: 'Administrador',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}, null, 2));