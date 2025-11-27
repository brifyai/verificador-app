#!/usr/bin/env node

// Script para diagnosticar por qué no se muestran las opciones del menú
const { ROLE_PERMISSIONS, hasPermission } = require('../lib/permissions.ts');

console.log('🔍 Diagnóstico de Navegación del Menú');
console.log('=====================================\n');

// Simular usuario ADMIN
const userRole = 'ADMIN';
console.log('👤 Usuario actual:', userRole);

// Navegación completa del sidebar
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

console.log('📋 Permisos definidos en ROLE_PERMISSIONS:');
Object.entries(ROLE_PERMISSIONS).forEach(([path, roles]) => {
  console.log(`  ${path}: [${roles.join(', ')}]`);
});

console.log('\n🔍 Verificación de permisos para usuario ADMIN:');

fullNavigation.forEach(item => {
  const hasPerm = hasPermission(userRole, item.href);
  const definedInPermissions = item.href in ROLE_PERMISSIONS;
  const rolesMatch = JSON.stringify(item.roles) === JSON.stringify(ROLE_PERMISSIONS[item.href] || []);
  
  console.log(`\n📍 ${item.name} (${item.href}):`);
  console.log(`   ✓ En navegación: roles [${item.roles.join(', ')}]`);
  console.log(`   ✓ En permisos: ${definedInPermissions ? 'SÍ' : '❌ NO'}`);
  if (definedInPermissions) {
    console.log(`   ✓ Roles coinciden: ${rolesMatch ? 'SÍ' : '❌ NO'}`);
    console.log(`   ✓ Usuario tiene permiso: ${hasPerm ? 'SÍ' : '❌ NO'}`);
  } else {
    console.log(`   ⚠️  No está definido en ROLE_PERMISSIONS`);
  }
});

console.log('\n🎯 Resultado final - Menú que debería ver el usuario ADMIN:');
const filteredMenu = fullNavigation.filter(item => hasPermission(userRole, item.href));
filteredMenu.forEach(item => {
  console.log(`  ✓ ${item.name} → ${item.href}`);
});

console.log('\n📊 Resumen:');
console.log(`  Total de opciones: ${fullNavigation.length}`);
console.log(`  Opciones visibles: ${filteredMenu.length}`);
console.log(`  Opciones bloqueadas: ${fullNavigation.length - filteredMenu.length}`);

// Verificar si las páginas existen físicamente
console.log('\n🔍 Verificación de existencia de archivos:');
const fs = require('fs');
const path = require('path');

const pagesToCheck = [
  { name: 'Grabaciones', path: 'app/app/(dashboard)/grabaciones/page.tsx' },
  { name: 'Audios', path: 'app/app/(dashboard)/audios/page.tsx' },
  { name: 'Radios', path: 'app/app/(dashboard)/radios/page.tsx' },
];

pagesToCheck.forEach(page => {
  const exists = fs.existsSync(path.join(process.cwd(), '..', page.path));
  console.log(`  ${exists ? '✓' : '❌'} ${page.name}: ${page.path}`);
});