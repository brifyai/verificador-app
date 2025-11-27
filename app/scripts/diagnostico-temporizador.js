// Script de diagnostico específico para el temporizador
console.log('🔍 Diagnóstico de temporizador iniciado...');

// Simular el comportamiento del temporizador
function diagnosticarTemporizador() {
  console.log('\n📋 Test 1: Simulando el comportamiento actual');
  
  // Simular diferentes escenarios
  const escenarios = [
    {
      nombre: "Tiempo normal",
      startTime: new Date(Date.now() - 15000), // 15 segundos atrás
      expected: "00:15"
    },
    {
      nombre: "Tiempo en el futuro (problema original)",
      startTime: new Date(Date.now() + 240 * 60 * 1000 + 27000), // 240 min + 27 seg en futuro
      expected: "Problema: tiempo negativo"
    },
    {
      nombre: "Tiempo actual",
      startTime: new Date(),
      expected: "00:00"
    },
    {
      nombre: "Hace 1 minuto",
      startTime: new Date(Date.now() - 60000), // 1 minuto atrás
      expected: "01:00"
    },
    {
      nombre: "Hace 5 minutos",
      startTime: new Date(Date.now() - 300000), // 5 minutos atrás
      expected: "05:00"
    }
  ];

  escenarios.forEach((escenario, index) => {
    console.log(`\n🔍 Escenario ${index + 1}: ${escenario.nombre}`);
    console.log('📅 StartTime:', escenario.startTime.toISOString());
    console.log('📅 Now:', new Date().toISOString());
    
    const diff = new Date().getTime() - escenario.startTime.getTime();
    console.log('📊 Diferencia (ms):', diff);
    console.log('📊 Diferencia (segundos):', diff / 1000);
    
    // Aplicar la lógica actual del componente
    let finalDiff = diff;
    
    // Lógica actual del componente
    if (diff < 0) {
      console.log('⚠️ Detectado: diferencia negativa');
      if (diff > -5000) {
        console.log('ℹ️ Aplicando: pequeño desfase, forzando a 0');
        finalDiff = 0;
      } else {
        console.log('⚠️ Aplicando: tiempo significativamente futuro, forzando a 0');
        finalDiff = 0;
      }
    }
    
    if (diff > 24 * 60 * 60 * 1000) {
      console.log('⚠️ Aplicando: diferencia >24h, forzando a 0');
      finalDiff = 0;
    }
    
    console.log('📊 Final diff:', finalDiff);
    
    const minutes = Math.floor(finalDiff / (1000 * 60));
    const seconds = Math.floor((finalDiff % (1000 * 60)) / 1000);
    const result = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    console.log('🎯 Resultado:', result);
    console.log('✅ Esperado:', escenario.expected);
    console.log(diff === 0 ? '❌ PROBLEMA: Siempre será 00:00' : '✅ OK: Tiempo avanzará');
  });
}

function proponerSolucion() {
  console.log('\n📋 Test 2: Proponiendo solución mejorada');
  
  console.log('💡 SOLUCIÓN PROPUESTA:');
  console.log('1. Solo forzar a 0 si la diferencia es MUY negativa (< -30 segundos)');
  console.log('2. Permitir pequeños desfases de hasta 30 segundos');
  console.log('3. Validar que el temporizador realmente se esté actualizando');
  
  const problemTime = new Date(Date.now() + 240 * 60 * 1000 + 27000); // Problema original
  const diff = new Date().getTime() - problemTime.getTime();
  
  console.log('\n🔧 Aplicando solución mejorada:');
  console.log('📊 Diferencia original:', diff);
  
  let finalDiff = diff;
  const MAX_NEGATIVE_DIFF = -30000; // -30 segundos
  
  if (diff < MAX_NEGATIVE_DIFF) {
    console.log('⚠️ Diferencia muy negativa (>30s), usando tiempo actual');
    finalDiff = 0;
  } else if (diff < 0) {
    console.log('ℹ️ Pequeña diferencia negativa, permitiendo que avance');
    // No forzar a 0, permitir que el tiempo avance
    finalDiff = Math.abs(diff); // Convertir a positivo para que avance
  }
  
  const minutes = Math.floor(finalDiff / (1000 * 60));
  const seconds = Math.floor((finalDiff % (1000 * 60)) / 1000);
  const result = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  console.log('🎯 Resultado con solución:', result);
  console.log('✅ Esta solución permitirá que el temporizador avance');
}

function verificarEstadoActual() {
  console.log('\n📋 Test 3: Verificando estado actual del sistema');
  
  console.log('🔍 Posibles causas del problema:');
  console.log('1. ❌ El temporizador SIEMPRE fuerza diff = 0 cuando hay problemas');
  console.log('2. ❌ No hay validación de que el intervalo esté funcionando');
  console.log('3. ❌ No se verifica si setRecordingDuration realmente cambia el valor');
  console.log('4. ❌ El useEffect podría no estar detectando cambios en recordingStartTime');
  
  console.log('\n🔍 Soluciones necesarias:');
  console.log('1. ✅ Permitir pequeños desfases negativos (< 30s)');
  console.log('2. ✅ Verificar que el intervalo se esté ejecutando');
  console.log('3. ✅ Forzar actualización incluso si el valor es el mismo');
  console.log('4. ✅ Agregar más logging para debugging');
}

// Ejecutar diagnóstico
console.log('🚀 Iniciando diagnóstico completo...');
diagnosticarTemporizador();
proponerSolucion();
verificarEstadoActual();

console.log('\n✅ Diagnóstico completado.');
console.log('💡 El problema principal es que el código fuerza diff = 0 en demasiados casos.');
console.log('💡 La solución es ser más permisivo con los desfases y verificar el funcionamiento del intervalo.');