import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para diagnosticar el problema del VPS
 * Simula la llamada que hace el VPS internamente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { radio_id, action = 'lookup' } = body;

    console.log('🔍 [VPS-DIAGNOSTIC] Diagnosticando problema del VPS');
    console.log('   Radio ID recibido:', radio_id);
    console.log('   Tipo de dato:', typeof radio_id);
    console.log('   Acción:', action);

    // Intentar conectar al VPS para obtener información de debug
    const vpsResponse = await fetch('http://213.199.39.147:5000/api/radios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!vpsResponse.ok) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo conectar al VPS',
        error: `HTTP ${vpsResponse.status}`
      });
    }

    const vpsData = await vpsResponse.json();
    const radios = vpsData.radios || [];
    
    console.log('   Total de radios en VPS:', radios.length);

    // Buscar la radio por diferentes métodos
    const results = {
      by_string: null,
      by_number: null,
      by_exact_match: null,
      all_attempts: []
    };

    // Convertir radio_id a diferentes formatos
    const searchValues = [
      String(radio_id),
      Number(radio_id),
      radio_id,
      `radio-${radio_id}`
    ];

    for (const searchValue of searchValues) {
      console.log(`   Buscando con valor: "${searchValue}" (tipo: ${typeof searchValue})`);
      
      // Buscar en el array de radios
      const found = radios.find((radio: any) => {
        // Probar diferentes propiedades
        return radio.id_radio == searchValue || 
               radio.id == searchValue ||
               String(radio.id_radio) === String(searchValue);
      });

      if (found) {
        results.all_attempts.push({
          searchValue,
          type: typeof searchValue,
          found: true,
          radio: found
        });
        console.log(`   ✅ Encontrada con "${searchValue}"`);
      } else {
        results.all_attempts.push({
          searchValue,
          type: typeof searchValue,
          found: false
        });
        console.log(`   ❌ No encontrada con "${searchValue}"`);
      }
    }

    // Determinar si se encontró al menos una
    const successfulAttempts = results.all_attempts.filter(a => a.found);
    const foundRadio = successfulAttempts.length > 0 ? successfulAttempts[0].radio : null;

    if (foundRadio) {
      console.log('   ✅ Radio encontrada en diagnóstico');
      return NextResponse.json({
        success: true,
        message: 'Radio encontrada en diagnóstico',
        radio: foundRadio,
        search_results: results.all_attempts,
        recommendation: 'El problema está en cómo el VPS internamente busca la radio. Nuestra búsqueda funciona, pero la del VPS no.'
      });
    } else {
      console.log('   ❌ Radio no encontrada ni siquiera en diagnóstico');
      return NextResponse.json({
        success: false,
        message: 'Radio no encontrada ni en diagnóstico',
        search_results: results.all_attempts,
        recommendation: 'Verificar si el radio_id existe realmente en el VPS'
      });
    }

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en diagnóstico',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * GET: Obtener información de debug del VPS
 */
export async function GET() {
  try {
    console.log('📊 [VPS-DIAGNOSTIC] Obteniendo información de debug del VPS');

    const vpsResponse = await fetch('http://213.199.39.147:5000/api/radios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!vpsResponse.ok) {
      return NextResponse.json({
        success: false,
        message: 'No se pudo conectar al VPS',
        error: `HTTP ${vpsResponse.status}`
      });
    }

    const vpsData = await vpsResponse.json();
    const radios = vpsData.radios || [];

    // Obtener algunas radios de ejemplo
    const sampleRadios = radios.slice(0, 5).map((radio: any) => ({
      id_radio: radio.id_radio,
      id: radio.id,
      name: radio.name,
      region: radio.region
    }));

    return NextResponse.json({
      success: true,
      message: 'Información de debug obtenida',
      total_radios: radios.length,
      sample_radios: sampleRadios,
      note: 'Usa POST con {radio_id: X} para diagnosticar una radio específica'
    });

  } catch (error) {
    console.error('💥 Error obteniendo debug del VPS:', error);
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo debug del VPS',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}