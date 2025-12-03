// 🔍 DIAGNÓSTICO ESPECÍFICO: Verificación de Stream
// Este script identifica exactamente dónde falla la verificación

console.log('=== DIAGNÓSTICO DE VERIFICACIÓN DE STREAM ===');
console.log('Hora:', new Date().toLocaleString());
console.log('');

// PASO 1: Verificar el flujo completo de verificación
async function diagnosticarVerificacionCompleta() {
  console.log('📋 PASO 1: Verificando flujo completo de verificación');
  
  try {
    // Simular la llamada exacta que hace RadioCard
    const streamUrl = 'https://radio.digitalfm.cl:8000/iquique2'; // URL del ejemplo
    const radioName = 'Digital';
    
    console.log('📡 Verificando stream:', streamUrl);
    console.log('📻 Radio:', radioName);
    
    // Llamar al verificador exactamente como lo hace RadioCard
    const response = await fetch('/api/verify-stream-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stream_url: streamUrl,
        radioName: radioName,
      }),
    });
    
    console.log('📊 Estado de respuesta:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📋 Resultado completo:', JSON.stringify(result, null, 2));
    
    // Análisis del resultado
    console.log('');
    console.log('🔍 ANÁLISIS DEL RESULTADO:');
    console.log('✅ Éxito:', result.success);
    console.log('📊 Estado:', result.status);
    console.log('💬 Mensaje:', result.message);
    console.log('🔗 URL verificada:', result.url);
    
    if (result.success) {
      console.log('✅ EL STREAM ESTÁ DISPONIBLE');
    } else {
      console.log('❌ EL STREAM NO ESTÁ DISPONIBLE');
      console.log('📝 Razón:', result.message);
      
      if (result.status === 'timeout') {
        console.log('⏰ Problema: Timeout');
      } else if (result.status === 'error') {
        console.log('💥 Problema: Error en la verificación');
      } else if (result.status === 'unavailable') {
        console.log('📡 Problema: Stream no accesible');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    return null;
  }
}

// PASO 2: Verificar el proceso de grabación
function analizarProcesoGrabacion() {
  console.log('');
  console.log('📋 PASO 2: Analizando proceso de grabación');
  
  // Verificar las grabaciones activas actuales
  fetch('/api/recording-vps-fixed')
    .then(response => response.json())
    .then(data => {
      console.log('📊 Grabaciones activas:', data);
      
      if (data.active_recordings && Object.keys(data.active_recordings).length > 0) {
        console.log('✅ Hay grabaciones activas');
        Object.entries(data.active_recordings).forEach(([radioId, recording]) => {
          console.log(`📻 Radio ${radioId}:`, recording);
        });
      } else {
        console.log('❌ No hay grabaciones activas');
      }
    })
    .catch(error => {
      console.error('❌ Error al obtener grabaciones:', error);
    });
}

// PASO 3: Verificar el estado del RecordingStateManager
function verificarRecordingStateManager() {
  console.log('');
  console.log('📋 PASO 3: Verificando RecordingStateManager');
  
  if (window.recordingStateManager) {
    console.log('✅ RecordingStateManager existe');
    
    // Obtener todas las radios que deberían estar grabando
    const radiosGrabando = ['22', '11']; // IDs de las radios con grabaciones activas
    
    radiosGrabando.forEach(radioId => {
      const isRecording = window.recordingStateManager.isRecording(radioId);
      const status = window.recordingStateManager.getRecordingStatus(radioId);
      
      console.log(`📻 Radio ${radioId}:`);
      console.log(`   ¿Grabando? ${isRecording}`);
      console.log(`   Estado:`, status);
    });
    
  } else {
    console.log('❌ RecordingStateManager no existe');
  }
}

// PASO 4: Verificar mensajes de error específicos
function buscarMensajesError() {
  console.log('');
  console.log('📋 PASO 4: Buscando mensajes de error específicos');
  
  // Buscar en la consola del navegador
  const mensajesError = [
    'Streaming no disponible',
    'Stream no accesible',
    'Stream verificado exitosamente',
    'Verificación exitosa con nuevo verificador',
    'Falló verificación'
  ];
  
  mensajesError.forEach(mensaje => {
    const elementos = document.querySelectorAll('*');
    let encontrado = false;
    
    elementos.forEach(el => {
      const texto = el.textContent || el.innerText || '';
      if (texto.includes(mensaje)) {
        console.log(`✅ Encontrado "${mensaje}":`, texto.substring(0, 100));
        encontrado = true;
      }
    });
    
    if (!encontrado) {
      console.log(`❌ No se encontró "${mensaje}"`);
    }
  });
}

// PASO 5: Verificar el estado del botón
function verificarEstadoBotones() {
  console.log('');
  console.log('📋 PASO 5: Verificando estado de los botones');
  
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach((btn, index) => {
    const texto = btn.textContent || btn.innerText || '';
    const disabled = btn.disabled;
    
    if (texto.includes('Grabar') || texto.includes('Grabando') || texto.includes('Detener')) {
      console.log(`📍 Botón ${index}: "${texto}"`);
      console.log(`   Deshabilitado: ${disabled}`);
      console.log(`   Clases: ${btn.className}`);
    }
  });
}

// Ejecutar diagnóstico completo
async function ejecutarDiagnosticoCompleto() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...');
  console.log('');
  
  const resultadoVerificacion = await diagnosticarVerificacionCompleta();
  
  setTimeout(() => analizarProcesoGrabacion(), 1000);
  setTimeout(() => verificarRecordingStateManager(), 2000);
  setTimeout(() => buscarMensajesError(), 3000);
  setTimeout(() => verificarEstadoBotones(), 4000);
  
  console.log('');
  console.log('⏳ Diagnóstico en progreso... los resultados aparecerán arriba ↑');
  console.log('');
  
  // Resumen final después de 6 segundos
  setTimeout(() => {
    console.log('📊 RESUMEN FINAL:');
    console.log('==================');
    
    if (resultadoVerificacion) {
      if (resultadoVerificacion.success) {
        console.log('✅ La verificación del stream está funcionando');
        console.log('✅ El stream está disponible');
        console.log('📝 El problema podría estar en el componente RadioCard');
      } else {
        console.log('❌ La verificación del stream está fallando');
        console.log('📝 Razón:', resultadoVerificacion.message);
      }
    } else {
      console.log('❌ No se pudo completar la verificación');
    }
    
    console.log('');
    console.log('🎯 SIGUIENTES PASOS:');
    console.log('1. Verificar los resultados del paso 2-5 arriba');
    console.log('2. Si el stream está disponible pero el botón no funciona, el problema está en RadioCard');
    console.log('3. Si el stream no está disponible, el problema es externo');
    
  }, 6000);
}

// Ejecutar
console.log('💡 Ejecutando diagnóstico completo...');
ejecutarDiagnosticoCompleto();