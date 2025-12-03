#!/usr/bin/env node

/**
 * Script de migración para cambiar el campo id de la tabla radios
 * de texto (CUID) a entero autoincremental (int8)
 * 
 * PASOS:
 * 1. Crear columna temporal para nuevos IDs
 * 2. Generar IDs secuenciales para registros existentes
 * 3. Actualizar todas las referencias foreign key
 * 4. Eliminar columna original y renombrar la nueva
 * 5. Actualizar esquema de Prisma
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateRadioIds() {
  console.log('🚀 Iniciando migración de IDs de radios...');
  
  try {
    // Paso 1: Verificar la estructura actual
    console.log('📊 Verificando estructura actual de la tabla radios...');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'radios' AND column_name = 'id'
    `;
    
    console.log('📋 Estructura actual del campo id:', tableInfo[0]);
    
    // Paso 2: Crear columna temporal para nuevos IDs
    console.log('🔧 Creando columna temporal para nuevos IDs...');
    
    await prisma.$executeRaw`
      ALTER TABLE radios 
      ADD COLUMN new_id BIGINT
    `;
    
    // Paso 3: Generar IDs secuenciales para registros existentes
    console.log('🔢 Generando IDs secuenciales para registros existentes...');
    
    await prisma.$executeRaw`
      WITH numbered_radios AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as row_num
        FROM radios
      )
      UPDATE radios r
      SET new_id = nr.row_num
      FROM numbered_radios nr
      WHERE r.id = nr.id
    `;
    
    // Paso 4: Verificar que se asignaron los IDs correctamente
    const updatedRadios = await prisma.$queryRaw`
      SELECT id, new_id, name 
      FROM radios 
      WHERE new_id IS NOT NULL 
      ORDER BY new_id
    `;
    
    console.log(`✅ Se asignaron ${updatedRadios.length} IDs nuevos`);
    console.log('📋 Primeros 5 registros con nuevos IDs:', updatedRadios.slice(0, 5));
    
    // Paso 5: Actualizar referencias en otras tablas
    console.log('🔗 Actualizando referencias foreign key...');
    
    // monitoring_sessions
    console.log('  📋 Actualizando monitoring_sessions...');
    await prisma.$executeRaw`
      UPDATE monitoring_sessions ms
      SET radio_id = (
        SELECT CAST(r.new_id AS TEXT)
        FROM radios r
        WHERE r.id = ms.radio_id
      )
      WHERE EXISTS (
        SELECT 1 FROM radios r2 
        WHERE r2.id = ms.radio_id AND r2.new_id IS NOT NULL
      )
    `;
    
    // detections
    console.log('  📋 Actualizando detections...');
    await prisma.$executeRaw`
      UPDATE detections d
      SET radio_id = (
        SELECT CAST(r.new_id AS TEXT)
        FROM radios r
        WHERE r.id = d.radio_id
      )
      WHERE EXISTS (
        SELECT 1 FROM radios r2 
        WHERE r2.id = d.radio_id AND r2.new_id IS NOT NULL
      )
    `;
    
    // radio_pricing_rules
    console.log('  📋 Actualizando radio_pricing_rules...');
    await prisma.$executeRaw`
      UPDATE radio_pricing_rules rpr
      SET radio_id = (
        SELECT CAST(r.new_id AS TEXT)
        FROM radios r
        WHERE r.id = rpr.radio_id
      )
      WHERE EXISTS (
        SELECT 1 FROM radios r2 
        WHERE r2.id = rpr.radio_id AND r2.new_id IS NOT NULL
      )
    `;
    
    // invoice_line_items
    console.log('  📋 Actualizando invoice_line_items...');
    await prisma.$executeRaw`
      UPDATE invoice_line_items ili
      SET radio_id = (
        SELECT CAST(r.new_id AS TEXT)
        FROM radios r
        WHERE r.id = ili.radio_id
      )
      WHERE EXISTS (
        SELECT 1 FROM radios r2 
        WHERE r2.id = ili.radio_id AND r2.new_id IS NOT NULL
      )
    `;
    
    // Paso 6: Eliminar columna original y renombrar la nueva
    console.log('🔄 Eliminando columna original y renombrando la nueva...');
    
    // Primero, eliminar la restricción de primary key
    await prisma.$executeRaw`
      ALTER TABLE radios 
      DROP CONSTRAINT radios_pkey
    `;
    
    // Eliminar la columna original
    await prisma.$executeRaw`
      ALTER TABLE radios 
      DROP COLUMN id
    `;
    
    // Renombrar la nueva columna
    await prisma.$executeRaw`
      ALTER TABLE radios 
      RENAME COLUMN new_id TO id
    `;
    
    // Establecer la nueva columna como primary key
    await prisma.$executeRaw`
      ALTER TABLE radios 
      ADD PRIMARY KEY (id)
    `;
    
    // Paso 7: Crear secuencia para autoincremento
    console.log('🔢 Creando secuencia para autoincremento...');
    
    await prisma.$executeRaw`
      CREATE SEQUENCE radios_id_seq
        START WITH ${updatedRadios.length + 1}
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1
    `;
    
    // Establecer valor por defecto usando la secuencia
    await prisma.$executeRaw`
      ALTER TABLE radios 
      ALTER COLUMN id SET DEFAULT nextval('radios_id_seq'::regclass)
    `;
    
    // Paso 8: Verificar el resultado final
    console.log('✅ Verificando resultado final...');
    
    const finalCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'radios' AND column_name = 'id'
    `;
    
    console.log('📋 Nueva estructura del campo id:', finalCheck[0]);
    
    const sampleData = await prisma.$queryRaw`
      SELECT id, name 
      FROM radios 
      ORDER BY id 
      LIMIT 5
    `;
    
    console.log('📋 Muestra de datos con nuevos IDs:', sampleData);
    
    console.log('🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
if (require.main === module) {
  migrateRadioIds()
    .then(() => {
      console.log('✅ Script de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script de migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateRadioIds };