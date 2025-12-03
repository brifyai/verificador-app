// 🔍 VERIFICACIÓN FINAL - Tiempo de Grabación en Vivo
// Este script verifica que el tiempo se esté actualizando en tiempo real

console.log('=== VERIFICACIÓN DE TIEMPO DE GRABACIÓN ===');
console.log('Hora actual:', new Date().toLocaleTimeString());

// Verificar grabaciones activas desde el backend
fetch('/api/recording-vps-fixed')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Grabaciones activas desde backend:', data);
    
    if (data.active_recordings && Object.keys(data.active_recordings).length > 0) {
      console.log('✅ Hay grabaciones activas en el sistema');
      
      Object.entries(data.active_recordings).forEach(([radioId, recording]) => {
        const startTime = new Date(recording.start_time);
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        console.log(`📻 Radio ${radioId}: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} transcurridos`);
      });
    } else {
      console.log('❌ No hay grabaciones activas en el backend');
    }
  })
  .catch(error => {
    console.error('❌ Error al verificar grabaciones:', error);
  });

// Verificar que los componentes estén renderizando el tiempo
setTimeout(() => {
  console.log('');
  console.log('🔍 Buscando botones con tiempo en el DOM...');
  
  const buttons = document.querySelectorAll('button');
  let recordingButtons = 0;
  
  buttons.forEach((btn, index) => {
    const text = btn.textContent || btn.innerText || '';
    if (text.includes('Grabando') || text.match(/\d{2}:\d{2}/)) {
      console.log(`✅ Botón ${index}: "${text}"`);
      recordingButtons++;
    }
  });
  
  if (recordingButtons === 0) {
    console.log('❌ No se encontraron botones mostrando tiempo de grabación');
    console.log('💡 Sugerencia: Verifica que hayas iniciado una grabación haciendo clic en "Grabar"');
  } else {
    console.log(`✅ Encontrados ${recordingButtons} botones con información de grabación`);
  }
  
  console.log('');
  console.log('🎯 CONCLUSIÓN:');
  console.log('Si el backend muestra grabaciones activas pero los botones no muestran el tiempo,');
  console.log('el problema podría estar en la sincronización entre el RecordingStateManager y los componentes.');
  
}, 2000);

console.log('');
console.log('⏳ Esperando 2 segundos para que se actualicen los componentes...');