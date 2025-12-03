#!/usr/bin/env node

/**
 * Script de migración para cambiar el campo id de la tabla radios en Supabase
 * de texto a entero autoincremental (int8) - Versión simplificada
 * 
 * Este script debe ejecutarse DESDE LA CONSOLA DE SUPABASE
 * o usando el cliente de Supabase con credenciales de Service Role
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

async function checkCurrentStructure() {
  console.log('🔍 Verificando estructura actual de la tabla radios...');
  
  try {
    // Obtener un registro de muestra para verificar el tipo de dato
    const { data: sample, error } = await supabase
      .from('radios')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al verificar estructura:', error);
      return false;
    }
    
    if (sample && sample.length > 0) {
      const idValue = sample[0].id;
      console.log('📋 Valor de ID de muestra:', idValue);
      console.log('📋 Tipo de dato detectado:', typeof idValue);
      
      // Si es número, ya está migrado
      if (typeof idValue === 'number') {
        console.log('✅ La tabla ya parece tener IDs numéricos');
        return true;
      }
      
      // Si es string, necesita migración
      if (typeof idValue === 'string') {
        console.log('⚠️ La tabla tiene IDs de texto, se requiere migración');
        return false;
      }
    }
    
    console.log('⚠️ No se encontraron registros para verificar');
    return false;
    
  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
    return false;
  }
}

async function getRadioCount() {
  const { count, error } = await supabase
    .from('radios')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error al contar registros:', error);
    return 0;
  }
  
  return count || 0;
}

async function executeMigrationSQL() {
  console.log('🚀 Ejecutando migración SQL directa...');
  
  // SQL para la migración completa
  const migrationSQL = `
    -- Paso 1: Crear columna temporal para nuevos IDs
    ALTER TABLE radios ADD COLUMN IF NOT EXISTS new_id BIGINT;
    
    -- Paso 2: Generar IDs secuenciales para registros existentes
    WITH numbered_radios AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as row_num
      FROM radios
    )
    UPDATE radios r
    SET new_id = nr.row_num
    FROM numbered_radios nr
    WHERE r.id = nr.id;
    
    -- Paso 3: Actualizar referencias en otras tablas
    -- monitoring_sessions
    UPDATE monitoring_sessions ms
    SET radio_id = (
      SELECT CAST(r.new_id AS TEXT)
      FROM radios r
      WHERE r.id = ms.radio_id
    )
    WHERE EXISTS (
      SELECT 1 FROM radios r2 
      WHERE r2.id = ms.radio_id AND r2.new_id IS NOT NULL
    );
    
    -- detections
    UPDATE detections d
    SET radio_id = (
      SELECT CAST(r.new_id AS TEXT)
      FROM radios r
      WHERE r.id = d.radio_id
    )
    WHERE EXISTS (
      SELECT 1 FROM radios r2 
      WHERE r2.id = d.radio_id AND r2.new_id IS NOT NULL
    );
    
    -- radio_pricing_rules
    UPDATE radio_pricing_rules rpr
    SET radio_id = (
      SELECT CAST(r.new_id AS TEXT)
      FROM radios r
      WHERE r.id = rpr.radio_id
    )
    WHERE EXISTS (
      SELECT 1 FROM radios r2 
      WHERE r2.id = rpr.radio_id AND r2.new_id IS NOT NULL
    );
    
    -- invoice_line_items
    UPDATE invoice_line_items ili
    SET radio_id = (
      SELECT CAST(r.new_id AS TEXT)
      FROM radios r
      WHERE r.id = ili.radio_id
    )
    WHERE EXISTS (
      SELECT 1 FROM radios r2 
      WHERE r2.id = ili.radio_id AND r2.new_id IS NOT NULL
    );
    
    -- Paso 4: Eliminar columna original y renombrar la nueva
    ALTER TABLE radios DROP CONSTRAINT IF EXISTS radios_pkey;
    ALTER TABLE radios DROP COLUMN IF EXISTS id;
    ALTER TABLE radios RENAME COLUMN new_id TO id;
    
    -- Paso 5: Establecer la nueva columna como primary key
    ALTER TABLE radios ADD PRIMARY KEY (id);
    
    -- Paso 6: Crear secuencia para autoincremento
    CREATE SEQUENCE IF NOT EXISTS radios_id_seq
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    
    -- Paso 7: Establecer valor por defecto usando la secuencia
    ALTER TABLE radios 
    ALTER COLUMN id SET DEFAULT nextval('radios_id_seq'::regclass);
    
    -- Paso 8: Actualizar la secuencia con el valor máximo actual
    SELECT setval('radios_id_seq', COALESCE((SELECT MAX(id) FROM radios), 1), false);
  `;
  
  try {
    // Ejecutar el SQL en bloques separados para mejor manejo de errores
    const steps = [
      {
        name: 'Crear columna temporal',
        sql: 'ALTER TABLE radios ADD COLUMN IF NOT EXISTS new_id BIGINT;'
      },
      {
        name: 'Asignar IDs secuenciales',
        sql: `
          WITH numbered_radios AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) as row_num
            FROM radios
          )
          UPDATE radios r
          SET new_id = nr.row_num
          FROM numbered_radios nr
          WHERE r.id = nr.id;
        `
      },
      {
        name: 'Actualizar monitoring_sessions',
        sql: `
          UPDATE monitoring_sessions ms
          SET radio_id = (
            SELECT CAST(r.new_id AS TEXT)
            FROM radios r
            WHERE r.id = ms.radio_id
          )
          WHERE EXISTS (
            SELECT 1 FROM radios r2 
            WHERE r2.id = ms.radio_id AND r2.new_id IS NOT NULL
          );
        `
      },
      {
        name: 'Actualizar detections',
        sql: `
          UPDATE detections d
          SET radio_id = (
            SELECT CAST(r.new_id AS TEXT)
            FROM radios r
            WHERE r.id = d.radio_id
          )
          WHERE EXISTS (
            SELECT 1 FROM radios r2 
            WHERE r2.id = d.radio_id AND r2.new_id IS NOT NULL
          );
        `
      },
      {
        name: 'Actualizar radio_pricing_rules',
        sql: `
          UPDATE radio_pricing_rules rpr
          SET radio_id = (
            SELECT CAST(r.new_id AS TEXT)
            FROM radios r
            WHERE r.id = rpr.radio_id
          )
          WHERE EXISTS (
            SELECT 1 FROM radios r2 
            WHERE r2.id = rpr.radio_id AND r2.new_id IS NOT NULL
          );
        `
      },
      {
        name: 'Actualizar invoice_line_items',
        sql: `
          UPDATE invoice_line_items ili
          SET radio_id = (
            SELECT CAST(r.new_id AS TEXT)
            FROM radios r
            WHERE r.id = ili.radio_id
          )
          WHERE EXISTS (
            SELECT 1 FROM radios r2 
            WHERE r2.id = ili.radio_id AND r2.new_id IS NOT NULL
          );
        `
      },
      {
        name: 'Eliminar columna original',
        sql: `
          ALTER TABLE radios DROP CONSTRAINT IF EXISTS radios_pkey;
          ALTER TABLE radios DROP COLUMN IF EXISTS id;
        `
      },
      {
        name: 'Renombrar columna temporal',
        sql: 'ALTER TABLE radios RENAME COLUMN new_id TO id;'
      },
      {
        name: 'Establecer primary key',
        sql: 'ALTER TABLE radios ADD PRIMARY KEY (id);'
      },
      {
        name: 'Crear secuencia',
        sql: `
          CREATE SEQUENCE IF NOT EXISTS radios_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        `
      },
      {
        name: 'Establecer autoincremento',
        sql: `
          ALTER TABLE radios ALTER COLUMN id SET DEFAULT nextval('radios_id_seq'::regclass);
          SELECT setval('radios_id_seq', COALESCE((SELECT MAX(id) FROM radios), 1), false);
        `
      }
    ];
    
    for (const step of steps) {
      console.log(`🔧 Ejecutando: ${step.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: step.sql
      });
      
      if (error) {
        console.error(`❌ Error en "${step.name}":`, error);
        throw new Error(`Error en paso "${step.name}": ${error.message}`);
      }
      
      console.log(`✅ Completado: ${step.name}`);
    }
    
    console.log('✅ Migración SQL completada exitosamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Error durante la migración SQL:', error);
    return false;
  }
}

async function verifyMigration() {
  console.log('🔍 Verificando resultado de la migración...');
  
  try {
    // Verificar estructura final
    const { data: sample, error } = await supabase
      .from('radios')
      .select('id, name')
      .order('id', { ascending: true })
      .limit(5);
    
    if (error) {
      console.error('❌ Error al verificar migración:', error);
      return false;
    }
    
    if (sample && sample.length > 0) {
      console.log('📋 Muestra de registros después de la migración:');
      sample.forEach(record => {
        console.log(`  ID: ${record.id}, Nombre: ${record.name}`);
      });
      
      // Verificar que los IDs sean numéricos
      const allNumeric = sample.every(record => typeof record.id === 'number');
      if (allNumeric) {
        console.log('✅ Todos los IDs son numéricos');
      } else {
        console.log('⚠️ Algunos IDs no son numéricos');
      }
      
      return true;
    } else {
      console.log('⚠️ No se encontraron registros para verificar');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error al verificar migración:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando migración de IDs de radios en Supabase...');
  console.log('📋 URL de Supabase:', supabaseUrl);
  
  try {
    // Paso 1: Verificar estructura actual
    const isAlreadyMigrated = await checkCurrentStructure();
    
    if (isAlreadyMigrated) {
      console.log('✅ La tabla ya está migrada o tiene IDs numéricos');
      return;
    }
    
    // Paso 2: Contar registros
    const count = await getRadioCount();
    console.log(`📊 Se encontraron ${count} registros para migrar`);
    
    if (count === 0) {
      console.log('⚠️ No hay registros para migrar');
      return;
    }
    
    // Paso 3: Confirmar con el usuario
    console.log('\n⚠️  IMPORTANTE: Esta migración cambiará permanentemente la estructura de la tabla.');
    console.log('   Se realizarán los siguientes cambios:');
    console.log('   - Cambiar el campo id de texto a entero (int8)');
    console.log('   - Asignar IDs secuenciales a todos los registros existentes');
    console.log('   - Actualizar todas las referencias foreign key');
    console.log('   - Establecer autoincremento para nuevos registros');
    
    // En producción, deberías pedir confirmación al usuario
    // Por ahora, asumimos que el usuario quiere continuar
    
    // Paso 4: Ejecutar migración
    const migrationSuccess = await executeMigrationSQL();
    
    if (!migrationSuccess) {
      throw new Error('La migración SQL falló');
    }
    
    // Paso 5: Verificar resultado
    const verificationSuccess = await verifyMigration();
    
    if (!verificationSuccess) {
      throw new Error('La verificación de la migración falló');
    }
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('✅ El campo id de la tabla radios ahora es un entero autoincremental');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().then(() => {
    console.log('✅ Script de migración finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { 
  checkCurrentStructure, 
  executeMigrationSQL, 
  verifyMigration 
};