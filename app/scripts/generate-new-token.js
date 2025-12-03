#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const ADMIN_EMAIL = 'admin@ondaverificada.com';
const ADMIN_ID = 'admin-' + Date.now();
const ADMIN_NAME = 'Administrador';

console.log('🔄 Generando nuevo token JWT para administrador...');

// Generar token con fecha actual y expiración en 7 días
const token = jwt.sign(
  {
    id: ADMIN_ID,
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
  },
  JWT_SECRET
);

console.log('✅ Token generado exitosamente');
console.log('📧 Email:', ADMIN_EMAIL);
console.log('🆔 ID:', ADMIN_ID);
console.log('⏰ Expira en:', new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString());
console.log('\n🔑 Token:');
console.log(token);

// Guardar en archivo
const tokenPath = path.join(__dirname, '..', 'admin-token.txt');
fs.writeFileSync(tokenPath, token);
console.log('\n💾 Token guardado en:', tokenPath);

console.log('\n📋 Para usar este token:');
console.log('1. Copia el token de arriba');
console.log('2. Guárdalo en un lugar seguro');
console.log('3. Úsalo en tus peticiones API o scripts');