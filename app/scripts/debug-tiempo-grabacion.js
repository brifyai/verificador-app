// Script para debuggear el problema del tiempo de grabación
console.log('🐛 Debug de tiempo de grabación iniciado...');

// Función para simular el problema
function testTimeCalculation() {
  console.log('\n📋 Test 1: Simulando el problema');
  
  // Simular valores que podrían estar causando el problema
  const now = new Date();
  const problematicStartTime = new Date(now.getTime() + 240 * 60 * 1000 + 27 * 1000); // 240 minutos y 27 segundos en el futuro
  
  console.log('⏰ Tiempo actual:', now.toISOString());
  console.log('⏰ Tiempo de inicio (problema):', problematicStartTime.toISOString());
  
  const diff = now.getTime() - problematicStartTime.getTime();
  console.log('⏰ Diferencia:', diff, 'ms');
  console.log('⏰ Diferencia en segundos:', diff / 1000);
  console.log('⏰ Diferencia en minutos:', diff / (1000 * 60));
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  console.log('⏰ Minutos:', minutes);
  console.log('⏰ Segundos:', seconds);
  console.log('⏰ Resultado:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
}

function testSoluciones() {
  console.log('\n📋 Test 2: Probando soluciones');
  
  const now = new Date();
  const futureTime = new Date(now.getTime() + 240 * 60 * 1000 + 27 * 1000);
  
  console.log('🔧 Solución 1: Forzar tiempo positivo');
  let diff = now.getTime() - futureTime.getTime();
  if (diff < 0) {
    diff = 0;
    console.log('✅ Diferencia forzada a 0 (evita negativos)');
  }
  
  let minutes = Math.floor(diff / (1000 * 60));
  let seconds = Math.floor((diff % (1000 * 60)) / 1000);
  console.log('✅ Resultado corregido:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  
  console.log('\n🔧 Solución 2: Usar fecha actual si el tiempo de inicio es futuro');
  const correctedStartTime = futureTime > now ? now : futureTime;
  diff = now.getTime() - correctedStartTime.getTime();
  minutes = Math.floor(diff / (1000 * 60));
  seconds = Math.floor((diff % (1000 * 60)) / 1000);
  console.log('✅ Resultado con corrección de fecha:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  
  console.log('\n🔧 Solución 3: Validar que el tiempo de inicio no sea futuro');
  const maxFutureTime = 5000; // 5 segundos en el futuro como máximo
  const timeDifference = futureTime.getTime() - now.getTime();
  if (timeDifference > maxFutureTime) {
    console.log('⚠️ Tiempo de inicio muy futuro, usando fecha actual');
    const validStartTime = now;
    diff = now.getTime() - validStartTime.getTime();
    minutes = Math.floor(diff / (1000 * 60));
    seconds = Math.floor((diff % (1000 * 60)) / 1000);
    console.log('✅ Resultado con validación:', `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }
}

function testFormatosFecha() {
  console.log('\n📋 Test 3: Probando diferentes formatos de fecha');
  
  const now = new Date();
  const isoString = now.toISOString();
  const timestamp = now.getTime();
  
  console.log('📅 Fecha actual:', now);
  console.log('📅 ISO String:', isoString);
  console.log('📅 Timestamp:', timestamp);
  console.log('📅 new Date(isoString):', new Date(isoString));
  console.log('📅 new Date(timestamp):', new Date(timestamp));
  
  // Probar con string ISO
  const fromISO = new Date(isoString);
  console.log('📅 fromISO.getTime():', fromISO.getTime());
  console.log('📅 Diferencia con ahora:', now.getTime() - fromISO.getTime());
}

// Ejecutar tests
console.log('🚀 Iniciando tests de depuración...');
testTimeCalculation();
testSoluciones();
testFormatosFecha();

console.log('\n✅ Tests completados. Los resultados muestran:');
console.log('- El problema ocurre cuando recordingStartTime está en el futuro');
console.log('- La solución es validar y corregir el tiempo de inicio');
console.log('- Usar fecha actual si el tiempo de inicio es muy futuro');
console.log('- Forzar diferencia a 0 si es negativa');