require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTableViaAPI(tableName, columns) {
  console.log(`🔧 Creando tabla: ${tableName}`);
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns.join(',\n      ')}
    );
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (response.ok) {
      console.log(`✅ Tabla ${tableName} creada exitosamente`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Error creando ${tableName}:`, error);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error en API para ${tableName}:`, error.message);
    return false;
  }
}

async function createAllTables() {
  console.log('🚀 Creando todas las tablas en Supabase via API...');
  console.log('URL:', SUPABASE_URL);
  console.log('===============================================');
  
  const tables = [
    {
      name: 'users',
      columns: [
        'id TEXT PRIMARY KEY',
        'email TEXT UNIQUE NOT NULL',
        'name TEXT',
        'password TEXT NOT NULL',
        'role TEXT DEFAULT \'USER\'',
        'active BOOLEAN DEFAULT true',
        'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
      ]
    },
    {
      name: 'radios',
      columns: [
        'id TEXT PRIMARY KEY',
        'name TEXT NOT NULL',
        'stream_url TEXT NOT NULL',
        'platform TEXT NOT NULL',
        'region TEXT',
        'description TEXT',
        'status TEXT DEFAULT \'ACTIVE\'',
        'priority INTEGER DEFAULT 1',
        'cost_per_hour DECIMAL(10,2) DEFAULT 0.0',
        'metadata JSONB',
        'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'last_verification_status TEXT',
        'last_verified_at TIMESTAMP WITH TIME ZONE'
      ]
    },
    {
      name: 'phrases',
      columns: [
        'id TEXT PRIMARY KEY',
        'phrase TEXT NOT NULL',
        'brand TEXT NOT NULL',
        'campaign TEXT',
        'category TEXT DEFAULT \'PRODUCT\'',
        'description TEXT',
        'confidence DECIMAL(3,2) DEFAULT 0.85',
        'priority INTEGER DEFAULT 1',
        'active BOOLEAN DEFAULT true',
        'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
      ]
    },
    {
      name: 'monitoring_sessions',
      columns: [
        'id TEXT PRIMARY KEY',
        'radio_id TEXT NOT NULL',
        'user_id TEXT NOT NULL',
        'status TEXT DEFAULT \'ACTIVE\'',
        'start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'end_time TIMESTAMP WITH TIME ZONE',
        'capture_interval INTEGER DEFAULT 30',
        'capture_duration INTEGER DEFAULT 10',
        'total_captures INTEGER DEFAULT 0',
        'total_detections INTEGER DEFAULT 0',
        'last_capture_at TIMESTAMP WITH TIME ZONE',
        'last_detection_at TIMESTAMP WITH TIME ZONE',
        'recording_start_hour INTEGER DEFAULT 5',
        'recording_end_hour INTEGER DEFAULT 2',
        'configuration JSONB',
        'metadata JSONB',
        'FOREIGN KEY (radio_id) REFERENCES radios(id)',
        'FOREIGN KEY (user_id) REFERENCES users(id)'
      ]
    },
    {
      name: 'captures',
      columns: [
        'id TEXT PRIMARY KEY',
        'session_id TEXT NOT NULL',
        'audio_path TEXT',
        'duration DECIMAL(10,2) NOT NULL',
        'file_size BIGINT',
        'format TEXT',
        'bitrate INTEGER',
        'sample_rate INTEGER',
        'status TEXT DEFAULT \'PROCESSING\'',
        'captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'processed_at TIMESTAMP WITH TIME ZONE',
        'transcription_text TEXT',
        'confidence DECIMAL(3,2)',
        'provider TEXT',
        'processing_time DECIMAL(10,2)',
        'cost DECIMAL(10,2) DEFAULT 0.0',
        'metadata JSONB',
        'FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id)'
      ]
    },
    {
      name: 'detections',
      columns: [
        'id TEXT PRIMARY KEY',
        'session_id TEXT NOT NULL',
        'capture_id TEXT NOT NULL',
        'radio_id TEXT NOT NULL',
        'phrase_id TEXT NOT NULL',
        'detected_text TEXT NOT NULL',
        'original_text TEXT NOT NULL',
        'confidence DECIMAL(3,2) NOT NULL',
        'similarity DECIMAL(3,2) NOT NULL',
        'timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        'audio_timestamp DECIMAL(10,2)',
        'verified BOOLEAN DEFAULT false',
        'false_positive BOOLEAN DEFAULT false',
        'cost DECIMAL(10,2) DEFAULT 0.0',
        'metadata JSONB',
        'FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id)',
        'FOREIGN KEY (capture_id) REFERENCES captures(id)',
        'FOREIGN KEY (radio_id) REFERENCES radios(id)',
        'FOREIGN KEY (phrase_id) REFERENCES phrases(id)'
      ]
    }
  ];
  
  let successCount = 0;
  
  for (const table of tables) {
    const success = await createTableViaAPI(table.name, table.columns);
    if (success) successCount++;
    
    // Pequeña pausa entre tablas
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Resultado:');
  console.log(`✅ Tablas creadas: ${successCount}/${tables.length}`);
  
  if (successCount === tables.length) {
    console.log('\n🎉 ¡Todas las tablas creadas exitosamente!');
    console.log('📝 Ahora puedes ejecutar las migraciones de Prisma');
  } else {
    console.log('\n⚠️ Algunas tablas no pudieron crearse');
    console.log('💡 Verifica los permisos y configura manualmente en el dashboard de Supabase');
  }
}

createAllTables();