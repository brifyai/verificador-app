// Script para verificar el esquema de la base de datos
const { execSync } = require('child_process');
const fs = require('fs');

function checkDatabaseSchema() {
  console.log('🔍 VERIFICANDO ESQUEMA DE BASE DE DATOS');
  console.log('='.repeat(60));

  try {
    // 1. Verificar que Prisma esté configurado
    console.log('1️⃣ Verificando configuración de Prisma...');
    
    if (fs.existsSync('prisma/schema.prisma')) {
      console.log('✅ Archivo schema.prisma encontrado');
      
      // Leer el schema
      const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
      
      // Buscar modelos de Radio y Phrase
      const hasRadioModel = schema.includes('model Radio') || schema.includes('model radio');
      const hasPhraseModel = schema.includes('model Phrase') || schema.includes('model phrase');
      
      console.log(`📻 Modelo Radio: ${hasRadioModel ? '✅ Encontrado' : '❌ No encontrado'}`);
      console.log(`🔍 Modelo Phrase: ${hasPhraseModel ? '✅ Encontrado' : '❌ No encontrado'}`);
      
      if (hasRadioModel) {
        console.log('\n📋 Campos del modelo Radio encontrados en schema:');
        const radioSection = schema.match(/model Radio\s*{[^}]*}/i);
        if (radioSection) {
          const fields = radioSection[0].match(/\w+\s+\w+/g) || [];
          fields.forEach(field => console.log(`   - ${field}`));
        }
      }
      
      if (hasPhraseModel) {
        console.log('\n📋 Campos del modelo Phrase encontrados en schema:');
        const phraseSection = schema.match(/model Phrase\s*{[^}]*}/i);
        if (phraseSection) {
          const fields = phraseSection[0].match(/\w+\s+\w+/g) || [];
          fields.forEach(field => console.log(`   - ${field}`));
        }
      }
      
    } else {
      console.log('❌ No se encontró prisma/schema.prisma');
      return;
    }

    // 2. Verificar conexión a la base de datos
    console.log('\n2️⃣ Verificando conexión a PostgreSQL...');
    
    try {
      execSync('npx prisma db pull --print', { stdio: 'pipe' });
      console.log('✅ Conexión a PostgreSQL exitosa');
    } catch (error) {
      console.log('❌ Error conectando a PostgreSQL:', error.message);
      console.log('💡 Verifica tu DATABASE_URL en .env');
      return;
    }

    // 3. Generar cliente Prisma
    console.log('\n3️⃣ Generando cliente Prisma...');
    
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✅ Cliente Prisma generado correctamente');
    } catch (error) {
      console.log('❌ Error generando cliente Prisma:', error.message);
    }

    // 4. Verificar estructura de tablas
    console.log('\n4️⃣ Verificando estructura de tablas...');
    
    try {
      const introspection = execSync('npx prisma db pull --print', { encoding: 'utf8' });
      
      if (introspection.includes('model Radio') || introspection.includes('model radio')) {
        console.log('✅ Tabla Radio existe en la base de datos');
      } else {
        console.log('❌ Tabla Radio no encontrada en la base de datos');
      }
      
      if (introspection.includes('model Phrase') || introspection.includes('model phrase')) {
        console.log('✅ Tabla Phrase existe en la base de datos');
      } else {
        console.log('❌ Tabla Phrase no encontrada en la base de datos');
      }
      
    } catch (error) {
      console.log('⚠️ No se pudo verificar estructura de tablas:', error.message);
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Si faltan tablas, ejecuta: npx prisma db push');
    console.log('2. Si necesitas datos de prueba, ejecuta: npx prisma db seed');
    console.log('3. Verifica que las tablas tengan los campos necesarios:');
    console.log('   - Radio: id, name, streamUrl, region, metadata, active');
    console.log('   - Phrase: id, phrase, brand, campaign, category, description, active');

  } catch (error) {
    console.error('❌ Error verificando esquema:', error.message);
    console.log('\n💡 Soluciones posibles:');
    console.log('- Verifica que estés en el directorio correcto');
    console.log('- Ejecuta: npm install');
    console.log('- Verifica tu archivo .env con DATABASE_URL');
  }
}

// Ejecutar verificación
checkDatabaseSchema();
