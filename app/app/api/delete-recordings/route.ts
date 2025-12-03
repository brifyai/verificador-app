import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export async function DELETE() {
  try {
    console.log('🗑️ Borrando todas las grabaciones de Supabase...');
    
    // Obtener todas las grabaciones primero
    const { data: recordings, error: fetchError } = await supabase
      .from('recordings')
      .select('id');
    
    if (fetchError) {
      console.error('❌ Error obteniendo grabaciones:', fetchError);
      return NextResponse.json({ error: 'Error obteniendo grabaciones' }, { status: 500 });
    }
    
    console.log(`📋 Encontradas ${recordings?.length || 0} grabaciones para borrar`);
    
    if (recordings && recordings.length > 0) {
      // Borrar todas las grabaciones
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todas excepto una ID imposible
      
      if (deleteError) {
        console.error('❌ Error borrando grabaciones:', deleteError);
        return NextResponse.json({ error: 'Error borrando grabaciones' }, { status: 500 });
      }
      
      console.log(`✅ Borradas ${recordings.length} grabaciones exitosamente`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Borradas ${recordings?.length || 0} grabaciones`,
      deletedCount: recordings?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Error en el proceso de borrado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}