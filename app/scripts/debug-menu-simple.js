#!/usr/bin/env node

// Script simplificado para diagnosticar el menú
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de Navegación del Menú');
console.log('=====================================\n');

// Leer el archivo de permisos directamente
const permissionsPath = path.join(__dirname, '../lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

// Extraer ROLE_PERMISSIONS del contenido
const rolePermissionsMatch = permissionsContent.match(/export const ROLE_PERMISSIONS = \{([\s\S]*?)\};/);
if (!rolePermissionsMatch) {
  console.error('❌ No se pudo encontrar ROLE_PERMISSIONS');
  process.exit(1);
}

console.log('📋 Permisos encontrados en ROLE_PERMISSIONS:');

// Parsear las rutas y roles
const permissionsBlock = rolePermissionsMatch[1];
const permissionMatches = permissionsBlock.match(/'([^']+)': \[([^\]]+)\]/g) || [];

permissionMatches.forEach(match => {
  const [, path, roles] = match.match(/'([^']+)': \[(.*?)\]/);
  console.log(`  ${path}: [${roles.replace(/'/g, '').replace(/\s+/g, ' ')}]`);
});

// Navegación completa del sidebar (del archivo sidebar.tsx)
const fullNavigation = [
  { name: 'Dashboard', href: '/dashboard', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Reportes', href: '/reportes', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Mis Frases', href: '/frases', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Radios', href: '/radios', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Grabaciones', href: '/grabaciones', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Audios', href: '/audios', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Monitoreo', href: '/monitoreo', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Verificación', href: '/verificacion', roles: ['USER', 'MODERATOR', 'ADMIN'] },
  { name: 'Inteligencia', href: '/inteligencia', roles: ['MODERATOR', 'ADMIN'] },
  { name: 'Equipo', href: '/equipo', roles: ['MODERATOR', 'ADMIN'] },
  { name: 'Configuración', href: '/configuracion', roles: ['ADMIN'] },
  { name: 'Mi Perfil', href: '/perfil', roles: ['USER', 'MODERATOR', 'ADMIN'] },
];

console.log('\n🔍 Verificación de rutas del menú:');

fullNavigation.forEach(item => {
  const definedInPermissions = permissionMatches.some(match => {
    const [, path] = match.match(/'([^']+)':/);
    return path === item.href;
  });
  
  console.log(`\n📍 ${item.name} (${item.href}):`);
  console.log(`   ✓ En navegación: roles [${item.roles.join(', ')}]`);
  console.log(`   ✓ En permisos: ${definedInPermissions ? 'SÍ' : '❌ NO'}`);
  
  if (!definedInPermissions) {
    console.log(`   ⚠️  CRÍTICO: No está definido en ROLE_PERMISSIONS`);
  }
});

// Verificar si las páginas existen físicamente
console.log('\n🔍 Verificación de existencia de archivos:');
const pagesToCheck = [
  { name: 'Grabaciones', path: 'app/app/(dashboard)/grabaciones/page.tsx' },
  { name: 'Audios', path: 'app/app/(dashboard)/audios/page.tsx' },
  { name: 'Radios', path: 'app/app/(dashboard)/radios/page.tsx' },
];

pagesToCheck.forEach(page => {
  const fullPath = path.join(__dirname, '..', page.path);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✓' : '❌'} ${page.name}: ${page.path}`);
  if (!exists) {
    console.log(`     ⚠️  El archivo NO existe físicamente`);
  }
});

console.log('\n💡 SOLUCIÓN:');
console.log('Para que aparezcan las opciones en el menú:');
console.log('1. ✅ La ruta debe estar definida en ROLE_PERMISSIONS');
console.log('2. ✅ El archivo page.tsx debe existir físicamente');
console.log('3. ✅ El usuario debe tener el rol adecuado');
console.log('\n📝 Las rutas faltantes deben agregarse a ROLE_PERMISSIONS en app/lib/permissions.ts');