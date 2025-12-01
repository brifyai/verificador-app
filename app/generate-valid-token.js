const jwt = require('jsonwebtoken');

// Clave secreta del sistema (debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generar un token válido para el usuario admin
const payload = {
  email: 'admin@example.com',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('Token JWT válido generado:');
console.log(token);
console.log('');
console.log('Payload:', JSON.stringify(payload, null, 2));