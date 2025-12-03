#!/usr/bin/env node

const jwt = require('jsonwebtoken');

// Generar un nuevo token de administrador
const adminUser = {
  id: 'admin-' + Date.now(),
  email: 'admin@ondaverificada.com',
  role: 'admin'
};

// Usar una clave secreta simple (en producción debería ser más segura)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

console.log('✅ Nuevo token de administrador generado:');
console.log(token);
console.log('\n📋 Información del token:');
console.log('- ID:', adminUser.id);
console.log('- Email:', adminUser.email);
console.log('- Rol:', adminUser.role);
console.log('- Expira en: 7 días');

// Guardar el token en un archivo
const fs = require('fs');
fs.writeFileSync('admin-token-new.txt', token);
console.log('\n💾 Token guardado en: admin-token-new.txt');