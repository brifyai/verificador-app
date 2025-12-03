#!/usr/bin/env node

// Script para generar un token JWT válido para el admin
const jwt = require('jsonwebtoken');

// Clave secreta del JWT (debe coincidir con la del middleware)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Datos del usuario admin
const adminUser = {
  userId: 'admin-1',
  email: 'admin@ondaverificada.com',
  role: 'admin'
};

// Generar token con expiración de 30 días
const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '30d' });

console.log('Token JWT generado para admin:');
console.log(token);
console.log('\nPuedes usar este token en tus scripts de sincronización.');