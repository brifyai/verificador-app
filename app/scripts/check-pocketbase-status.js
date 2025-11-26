#!/usr/bin/env node

const PocketBase = require('pocketbase');

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const ADMIN_EMAIL = 'camiloalegriabarra@gmail.com';
const ADMIN_PASSWORD = 'Aintelligence2025$';

async function checkStatus() {
  console.log('🔍 Verificando estado de PocketBase...\n');
  
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Autenticar
    console.log('1. Autenticando...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Autenticación exitosa\n');
    
    // Listar colecciones
    console.log('2. Listando colecciones...');
    const collections = await pb.collections.getFullList();
    
    if (collections.length === 0) {
      console.log('❌ No hay colecciones creadas');
      console.log('\n💡 Solución: Ejecuta node scripts/setup-pocketbase.js');
    } else {
      console.log(`✅ Se encontraron ${collections.length} colecciones:`);
      collections.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status === 404) {
      console.log('\n💡 La colección no existe. Ejecuta: node scripts/setup-pocketbase.js');
    }
  }
}

checkStatus();