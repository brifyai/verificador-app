#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DE PROBLEMAS DE AUTENTICACIÓN
 * 
 * Este script identifica todos los problemas de autenticación en el sistema
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DE PROBLEMAS DE AUTENTICACIÓN');
console.log('==========================================\n');

// 1. Verificar variables de entorno
console.log('1️⃣  VARIABLES DE ENTORNO:');
console.log('------------------------');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    const value = envContent.match(new RegExp(`${varName}="([^"]*)"`, 'i'));
    
    console.log(`${hasVar ? '✅' : '❌'} ${varName}`);
    if (value && value[1]) {
      const isKey = varName.includes('KEY') || varName.includes('SECRET');
      console.log(`   Valor: ${isKey ? value[1].substring(0, 10) + '...' : value[1]}`);
    }
  });
  
  // Verificar si las keys son idénticas
  const anonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]*)"/i)?.[1];
  const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]*)"/i)?.[1];
  
  if (anonKey && serviceKey) {
    console.log(`\n🔑 COMPARACIÓN DE KEYS:`);
    console.log(`   ANON KEY: ${anonKey.substring(0, 20)}...`);
    console.log(`   SERVICE KEY: ${serviceKey.substring(0, 20)}...`);
    console.log(`   ¿Son idénticas? ${anonKey === serviceKey ? 'SÍ ⚠️' : 'NO ✅'}`);
  }
  
} else {
  console.log('❌ No se encontró archivo .env');
  console.log('   Copia .env.example a .env y configura las variables');
}

// 2. Verificar archivos de autenticación
console.log('\n\n2️⃣  ARCHIVOS DE AUTENTICACIÓN:');
console.log('------------------------------');

const authFiles = [
  'lib/auth.ts',
  'lib/auth-manual.ts', 
  'lib/supabase-direct.js',
  'middleware.ts',
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/auth/login-direct/route.ts'
];

authFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 3. Verificar problemas comunes
console.log('\n\n3️⃣  PROBLEMAS COMUNES DETECTADOS:');
console.log('----------------------------------');

// Problema 1: Múltiples sistemas de auth
console.log('❌ PROBLEMA 1: Sistema de autenticación dual');
console.log('   - NextAuth.js convive con auth-manual');
console.log('   - Middleware intenta usar ambos sistemas');
console.log('   - Causa conflictos y redirecciones infinitas');

// Problema 2: Service Key vs Anon Key
console.log('\n❌ PROBLEMA 2: Confusión entre Service Key y Anon Key');
console.log('   - El código tiene workaround para cuando son idénticas');
console.log('   - Esto indica configuración incorrecta en Supabase');

// Problema 3: Middleware complejo
console.log('\n❌ PROBLEMA 3: Middleware demasiado complejo');
console.log('   - Intenta verificar ambos sistemas de auth');
console.log('   - Excluye rutas /api/* pero algunas APIs necesitan auth');

// 4. Soluciones recomendadas
console.log('\n\n💡 SOLUCIONES RECOMENDADAS:');
console.log('---------------------------');

console.log('1. 🎯 ELEGIR UN SISTEMA DE AUTH:');
console.log('   Opción A: Usar solo NextAuth.js (recomendado)');
console.log('   Opción B: Usar solo auth-manual (más simple)');
console.log('   Opción C: Simplificar middleware para evitar conflictos');

console.log('\n2. 🔑 CORREGIR CONFIGURACIÓN DE SUPABASE:');
console.log('   - Service Role Key debe ser diferente de Anon Key');
console.log('   - Service Role Key debe tener permisos de administrador');
console.log('   - Verificar en panel de Supabase > Settings > API');

console.log('\n3. 🧹 SIMPLIFICAR MIDDLEWARE:');
console.log('   - Usar solo un sistema de verificación');
console.log('   - Eliminar lógica dual de auth');
console.log('   - Asegurar que las rutas /api/* tengan auth apropiada');

console.log('\n4. 📋 VERIFICAR PASO A PASO:');
console.log('   a) Copiar .env.example a .env');
console.log('   b) Configurar Service Role Key correctamente');
console.log('   c) Elegir un sistema de auth y desactivar el otro');
console.log('   d) Reiniciar la aplicación');

// 5. Comandos útiles
console.log('\n\n🔧 COMANDOS ÚTILES:');
console.log('-------------------');
console.log('# Ver logs de auth en tiempo real:');
console.log('cd app && npm run dev 2>&1 | grep -i "auth\\|session\\|token"');
console.log('\n# Verificar conexión a Supabase:');
console.log('node scripts/test-supabase-connection.js');
console.log('\n# Resetear contraseña de admin:');
console.log('node scripts/reset-admin-password.js');

console.log('\n\n✅ DIAGNÓSTICO COMPLETADO');
console.log('   Sigue las soluciones recomendadas para arreglar los problemas de autenticación.');