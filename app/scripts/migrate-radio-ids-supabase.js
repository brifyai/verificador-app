#!/usr/bin/env node

/**
 * Script de migración para cambiar el campo id de la tabla radios en Supabase
 * de texto a entero autoincremental (int8)
 * 
 * IMPORTANTE: Este script requiere que la tabla tenga una columna temporal
 * para almacenar los nuevos IDs antes de la migración final.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function migrateRadioIdsToSupabase() {
  console.log('🚀 Iniciando migración de IDs de radios en Supabase...');
  
  try {
    // Paso 1: Verificar la estructura actual de la tabla radios
    console.log('📊 Verificando estructura actual de la tabla radios...');
    
    const { data: tableStructure, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'radios' });
    
    if (structureError) {
      console.log('📋 Obteniendo estructura mediante consulta directa...');
      // Método alternativo para verificar estructura
      const { data: sampleData, error: sampleError } = await supabase
        .from('radios')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        throw new Error(`Error al verificar estructura: ${sampleError.message}`);
      }
      
      if (sampleData && sampleData.length > 0) {
        const firstRecord = sampleData[0];
        console.log('📋 Estructura actual detectada:', typeof firstRecord.id);
        console.log('📋 Valor de ID de muestra:', firstRecord.id);
      }
    }
    
    // Paso 2: Obtener todos los registros actuales
    console.log('📋 Obteniendo todos los registros de radios...');
    
    const { data: allRadios, error: fetchError } = await supabase
      .from('radios')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Error al obtener radios: ${fetchError.message}`);
    }
    
    console.log(`📊 Se encontraron ${allRadios.length} registros de radios`);
    
    if (allRadios.length === 0) {
      console.log('⚠️ No hay registros para migrar');
      return;
    }
    
    // Paso 3: Verificar si ya existe la columna new_id
    console.log('🔍 Verificando si existe columna temporal...');
    
    const { data: testData, error: testError } = await supabase
      .from('radios')
      .select('new_id')
      .limit(1);
    
    const columnExists = !testError;
    console.log(`📋 Columna temporal existe: ${columnExists}`);
    
    // Paso 4: Crear columna temporal si no existe
    if (!columnExists) {
      console.log('🔧 Creando columna temporal new_id...');
      
      const { error: addColumnError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'radios',
        column_name: 'new_id',
        column_type: 'bigint'
      });
      
      if (addColumnError) {
        console.log('⚠️ Intentando método alternativo para agregar columna...');
        // Método alternativo: usar SQL directo
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE radios ADD COLUMN IF NOT EXISTS new_id BIGINT;'
        });
        
        if (sqlError) {
          throw new Error(`Error al crear columna temporal: ${sqlError.message}`);
        }
      }
    }
    
    // Paso 5: Asignar IDs secuenciales
    console.log('🔢 Asignando IDs secuenciales...');
    
    let updatedCount = 0;
    for (let i = 0; i < allRadios.length; i++) {
      const radio = allRadios[i];
      const newId = i + 1; // IDs comenzando desde 1
      
      const { error: updateError } = await supabase
        .from('radios')
        .update({ new_id: newId })
        .eq('id', radio.id);
      
      if (updateError) {
        console.error(`❌ Error al actualizar radio ${radio.id}: ${updateError.message}`);
      } else {
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`✅ Actualizados ${updatedCount}/${allRadios.length} registros...`);
        }
      }
    }
    
    console.log(`✅ Se actualizaron ${updatedCount} registros con nuevos IDs`);
    
    // Paso 6: Verificar la actualización
    console.log('🔍 Verificando actualización...');
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('radios')
      .select('id, new_id, name')
      .not('new_id', 'is', null)
      .order('new_id', { ascending: true })
      .limit(10);
    
    if (verificationError) {
      throw new Error(`Error en verificación: ${verificationError.message}`);
    }
    
    console.log('📋 Muestra de registros con nuevos IDs:', verificationData);
    
    // Paso 7: Actualizar esquema de Prisma
    console.log('📝 IMPORTANTE: Ahora debes actualizar el esquema de Prisma');
    console.log('📝 Cambia en app/prisma/schema.prisma:');
    console.log('   Antes: id String @id @default(cuid())');
    console.log('   Después: id BigInt @id @default(autoincrement())');
    
    // Paso 8: Instrucciones para completar la migración
    console.log('\n📋 INSTRUCCIONES PARA COMPLETAR LA MIGRACIÓN:');
    console.log('1. Actualiza el esquema de Prisma como se indicó arriba');
    console.log('2. Ejecuta: npx prisma generate');
    console.log('3. Crea una nueva migración: npx prisma migrate dev --name radio-id-to-int');
    console.log('4. Después de la migración, ejecuta el script de limpieza final');
    
    console.log('\n⚠️  IMPORTANTE: No ejecutes la migración final hasta que:');
    console.log('   - Todos los registros tengan new_id asignado');
    console.log('   - Hayas actualizado el esquema de Prisma');
    console.log('   - Hayas probado que todo funciona correctamente');
    
    console.log('\n🎉 Paso 1 de la migración completado exitosamente!');
    console.log('📋 Los nuevos IDs han sido asignados a la columna temporal new_id');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Script de limpieza final (se ejecuta después de la migración de Prisma)
async function completeMigrationCleanup() {
  console.log('🧹 Iniciando limpieza final de la migración...');
  
  try {
    // Paso 1: Eliminar la columna original id
    console.log('🗑️ Eliminando columna original id...');
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE radios DROP COLUMN IF EXISTS id;'
    });
    
    if (dropError) {
      throw new Error(`Error al eliminar columna original: ${dropError.message}`);
    }
    
    // Paso 2: Renombrar new_id a id
    console.log('🔄 Renombrando new_id a id...');
    
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE radios RENAME COLUMN new_id TO id;'
    });
    
    if (renameError) {
      throw new Error(`Error al renombrar columna: ${renameError.message}`);
    }
    
    // Paso 3: Establecer la nueva columna como primary key
    console.log('🔑 Estableciendo nueva columna como primary key...');
    
    const { error: pkError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE radios ADD PRIMARY KEY (id);'
    });
    
    if (pkError) {
      throw new Error(`Error al establecer primary key: ${pkError.message}`);
    }
    
    // Paso 4: Crear secuencia para autoincremento
    console.log('🔢 Creando secuencia para autoincremento...');
    
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('radios')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (maxIdError) {
      throw new Error(`Error al obtener máximo ID: ${maxIdError.message}`);
    }
    
    const maxId = maxIdData[0]?.id || 0;
    const nextId = maxId + 1;
    
    const { error: sequenceError } = await supabase.rpc('exec_sql', {
      sql: `CREATE SEQUENCE IF NOT EXISTS radios_id_seq START WITH ${nextId} INCREMENT BY 1;`
    });
    
    if (sequenceError) {
      throw new Error(`Error al crear secuencia: ${sequenceError.message}`);
    }
    
    // Paso 5: Establecer valor por defecto
    const { error: defaultError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE radios ALTER COLUMN id SET DEFAULT nextval(\'radios_id_seq\');'
    });
    
    if (defaultError) {
      throw new Error(`Error al establecer valor por defecto: ${defaultError.message}`);
    }
    
    console.log('✅ Limpieza final completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza final:', error);
    throw error;
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'migrate') {
      await migrateRadioIdsToSupabase();
    } else if (command === 'cleanup') {
      await completeMigrationCleanup();
    } else {
      console.log('📋 Uso:');
      console.log('  node migrate-radio-ids-supabase.js migrate   - Asignar nuevos IDs');
      console.log('  node migrate-radio-ids-supabase.js cleanup   - Completar migración después de Prisma');
      console.log('');
      console.log('📋 Pasos completos:');
      console.log('1. Ejecutar: node migrate-radio-ids-supabase.js migrate');
      console.log('2. Actualizar esquema de Prisma');
      console.log('3. Ejecutar: npx prisma migrate dev');
      console.log('4. Ejecutar: node migrate-radio-ids-supabase.js cleanup');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { 
  migrateRadioIdsToSupabase, 
  completeMigrationCleanup 
};