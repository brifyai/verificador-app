// Script para generar un token JWT válido para pruebas
const jwt = require('jsonwebtoken');

// Generar un token JWT válido para el usuario admin
const payload = {
  email: 'admin@ondaverificada.com',
  id: 'admin',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 días
};

const secret = 'your-secret-key'; // Este debe ser el mismo que usas en tu aplicación

const token = jwt.sign(payload, secret);

console.log('🔑 Token JWT válido generado:');
console.log(token);
console.log('\n📋 Payload del token:');
console.log(JSON.stringify(payload, null, 2));

// Guardar el token en un archivo
const fs = require('fs');
fs.writeFileSync('valid-token.txt', token);
console.log('\n✅ Token guardado en valid-token.txt');