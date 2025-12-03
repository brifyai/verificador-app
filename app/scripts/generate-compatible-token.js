#!/usr/bin/env node

/**
 * Script para generar un token JWT compatible con el middleware usando la función signJWT del proyecto
 */

const { signJWT } = require('../lib/jwt-simple');

// Información del usuario admin
const adminUser = {
  id: 'admin-1',
  email: 'admin@ondaverificada.com',
  name: 'Admin User',
  role: 'admin'
};

console.log('🔑 Generando token JWT compatible con el middleware...');
console.log('📝 Usuario:', adminUser);

async function generateToken() {
  try {
    // Generar token usando la función del proyecto
    const token = await signJWT(adminUser);
    
    console.log('\n✅ Token generado exitosamente!');
    console.log('\n🎯 Token completo:');
    console.log(token);
    
    // Guardar token en archivo
    const fs = require('fs');
    const path = require('path');
    const tokenPath = path.join(__dirname, '..', 'compatible-token.txt');
    fs.writeFileSync(tokenPath, token);
    console.log(`\n💾 Token guardado en: ${tokenPath}`);
    
    // Mostrar preview del token
    const tokenParts = token.split('.');
    console.log(`\n🔍 Token preview: ${tokenParts[0]}.${tokenParts[1].substring(0, 20)}...`);
    
    // Verificar el token (opcional)
    const { verifyJWT } = require('../lib/jwt-simple');
    const decoded = await verifyJWT(token);
    if (decoded) {
      console.log(`\n✅ Token verificado - Usuario: ${decoded.email} (${decoded.role})`);
    } else {
      console.log('\n❌ Error al verificar el token');
    }
    
  } catch (error) {
    console.error('❌ Error generando token:', error.message);
    process.exit(1);
  }
}

// Ejecutar
generateToken();