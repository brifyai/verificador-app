#!/usr/bin/env node

/**
 * Script para generar un token JWT válido con el secreto correcto del middleware
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// El secreto que usa el middleware (según los logs)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Información del usuario admin
const adminUser = {
  userId: 'admin-1',
  email: 'admin@ondaverificada.com',
  role: 'admin'
};

console.log('🔑 Generando token JWT válido...');
console.log('📝 Usuario:', adminUser);
console.log('🔐 Secreto:', JWT_SECRET.substring(0, 10) + '...');

try {
  // Generar token con expiración de 1 año
  const token = jwt.sign(adminUser, JWT_SECRET, { 
    expiresIn: '365d',
    algorithm: 'HS256'
  });

  console.log('\n✅ Token generado exitosamente!');
  console.log('\n🎯 Token completo:');
  console.log(token);
  
  // Guardar token en archivo
  const tokenPath = path.join(__dirname, '..', 'valid-token.txt');
  fs.writeFileSync(tokenPath, token);
  console.log(`\n💾 Token guardado en: ${tokenPath}`);
  
  // Mostrar preview del token
  const tokenParts = token.split('.');
  console.log(`\n🔍 Token preview: ${tokenParts[0]}.${tokenParts[1].substring(0, 10)}...`);
  
  // Verificar el token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(`\n✅ Token verificado - Expira: ${new Date(decoded.exp * 1000).toISOString()}`);
  
} catch (error) {
  console.error('❌ Error generando token:', error.message);
  process.exit(1);
}