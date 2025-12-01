#!/usr/bin/env node

/**
 * Script de depuración para verificar tokens JWT
 */

const jwt = require('jsonwebtoken');

// Token del log del usuario
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkB2ZXJpZmljYWRvci5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjQ0NjIzOTgsImV4cCI6MTc2NTA2NzE5OH0.a58CN-lQtylXq_T8JG8n5Yye-I034oN_evHgyBUQyVM';

console.log('🔍 Analizando token JWT...\n');

console.log('📊 Token completo:', userToken);
console.log('📏 Longitud del token:', userToken.length);

// Verificar formato básico
const parts = userToken.split('.');
console.log('🔢 Partes del token:', parts.length);
console.log('📋 Parte 1 (Header):', parts[0]);
console.log('📋 Parte 2 (Payload):', parts[1]);
console.log('📋 Parte 3 (Signature):', parts[2]);

if (parts.length === 3) {
  try {
    // Decodificar header
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log('📖 Header decodificado:', header);
    
    // Decodificar payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('📖 Payload decodificado:', payload);
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    console.log('⏰ Tiempo actual:', now);
    console.log('⏰ Expiración del token:', payload.exp);
    console.log('📅 ¿Está expirado?', now > payload.exp);
    
  } catch (error) {
    console.error('❌ Error decodificando token:', error);
  }
} else {
  console.error('❌ El token no tiene el formato correcto (debe tener 3 partes)');
}

// Probar a verificar con el secreto
const JWT_SECRET = process.env.JWT_SECRET;
if (JWT_SECRET) {
  console.log('\n🔑 Verificando con JWT_SECRET...');
  try {
    const decoded = jwt.verify(userToken, JWT_SECRET);
    console.log('✅ Token válido:', decoded);
  } catch (error) {
    console.error('❌ Error verificando token:', error.name, error.message);
  }
} else {
  console.log('\n⚠️  JWT_SECRET no está configurado en este script');
}

console.log('\n✅ Análisis completado');