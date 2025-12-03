// 🚀 DIAGNÓSTICO AUTOMÁTICO - Tiempo No Visible en Frontend
// Ejecutar esto en la consola del navegador (F12)

console.log('🚀 INICIANDO DIAGNÓSTICO AUTOMÁTICO...');
console.log('=========================================');

// Función para encontrar el botón de grabación específico
function findRecordingButton() {
    console.log('🔍 Buscando botón de grabación...');
    
    // Buscar todos los botones que puedan ser de grabación
    const buttons = document.querySelectorAll('button');
    let recordingButton = null;
    let primaveraButton = null;
    
    buttons.forEach((btn, index) => {
        const text = btn.textContent || btn.innerText || '';
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('grabar') || lowerText.includes('grabando') || lowerText.includes('primavera')) {
            console.log(`✅ Botón candidato ${index}: "${text}"`);
            
            if (lowerText.includes('primavera')) {
                primaveraButton = btn;
            }
            
            if (lowerText.includes('grabar') || lowerText.includes('grabando')) {
                recordingButton = btn;
            }
        }
    });
    
    return { recordingButton, primaveraButton, allButtons: buttons };
}

// Función para verificar el estado de grabación
function checkRecordingState() {
    console.log('📊 Verificando estado de grabación...');
    
    // Buscar el RecordingStateManager global
    const recordingManager = window.recordingStateManager;
    
    if (!recordingManager) {
        console.log('❌ RecordingStateManager no encontrado en window');
        return null;
    }
    
    // Verificar estado de radio 22 (Primavera)
    const isRecording22 = recordingManager.isRecording('22');
    const status22 = recordingManager.getRecordingStatus('22');
    
    console.log('✅ RecordingStateManager encontrado');
    console.log('📍 Estado radio 22:', status22);
    console.log('📍 ¿Grabando radio 22?', isRecording22);
    
    return { isRecording22, status22, manager: recordingManager };
}

// Función para buscar tiempo en el DOM
function findTimeInDOM() {
    console.log('⏰ Buscando tiempo en el DOM...');
    
    const timePattern = /\d{2}:\d{2}/;
    const elements = document.querySelectorAll('*');
    const timeElements = [];
    
    elements.forEach((el, index) => {
        const text = el.textContent || el.innerText || '';
        if (text && text.match(timePattern)) {
            timeElements.push({
                element: el,
                text: text,
                tagName: el.tagName,
                className: el.className,
                id: el.id
            });
        }
    });
    
    if (timeElements.length > 0) {
        console.log(`✅ Encontrados ${timeElements.length} elementos con tiempo:`);
        timeElements.forEach((item, i) => {
            console.log(`  ${i + 1}. "${item.text}" (${item.tagName}, class="${item.className}", id="${item.id}")`);
        });
    } else {
        console.log('❌ No se encontró ningún elemento con formato de tiempo HH:MM');
    }
    
    return timeElements;
}

// Función para verificar React components
function checkReactComponents() {
    console.log('⚛️ Verificando componentes React...');
    
    // Buscar evidencia de componentes React
    const reactRoots = document.querySelectorAll('[data-reactroot], #__next, #root');
    
    if (reactRoots.length > 0) {
        console.log(`✅ Encontrados ${reactRoots.length} roots de React`);
        
        // Buscar componentes RadioCard
        const radioCards = document.querySelectorAll('[class*="RadioCard"], [class*="radio"], [class*="card"]');
        console.log(`✅ Encontrados ${radioCards.length} posibles RadioCards`);
        
        return { reactRoots, radioCards };
    } else {
        console.log('❌ No se encontraron roots de React');
        return null;
    }
}

// Función principal de diagnóstico
function runFullDiagnosis() {
    console.log('🎯 INICIANDO DIAGNÓSTICO COMPLETO...');
    console.log('Hora actual:', new Date().toLocaleString());
    console.log('');
    
    // 1. Encontrar botones
    const { recordingButton, primaveraButton, allButtons } = findRecordingButton();
    
    console.log('');
    
    // 2. Verificar estado de grabación
    const recordingState = checkRecordingState();
    
    console.log('');
    
    // 3. Buscar tiempo en DOM
    const timeElements = findTimeInDOM();
    
    console.log('');
    
    // 4. Verificar componentes React
    const reactComponents = checkReactComponents();
    
    console.log('');
    
    // 5. Análisis final
    console.log('📋 ANÁLISIS FINAL:');
    console.log('==================');
    
    // Problema 1: ¿El botón existe?
    if (!recordingButton && !primaveraButton) {
        console.log('❌ PROBLEMA CRÍTICO: No se encontró ningún botón de grabación');
    } else {
        console.log('✅ Botón de grabación encontrado');
        
        // Problema 2: ¿Está grabando?
        if (recordingState && recordingState.isRecording22) {
            console.log('✅ El sistema indica que radio 22 está grabando');
            
            // Problema 3: ¿El tiempo aparece?
            if (timeElements.length === 0) {
                console.log('❌ PROBLEMA: No se muestra el tiempo a pesar de estar grabando');
                console.log('🎯 SOLUCIÓN: El problema está en la visualización, no en el backend');
            } else {
                console.log('✅ Se encontraron elementos con tiempo');
            }
        } else {
            console.log('❌ PROBLEMA: El sistema indica que radio 22 NO está grabando');
            console.log('🎯 SOLUCIÓN: El problema está en el estado de grabación');
        }
    }
    
    // 6. Recomendaciones específicas
    console.log('');
    console.log('🔧 RECOMENDACIONES:');
    console.log('==================');
    
    if (!recordingState || !recordingState.isRecording22) {
        console.log('1. Verificar por qué isRecording("22") retorna false');
        console.log('2. Revisar el hook useRecordingState en RadioCard');
        console.log('3. Verificar que el RecordingStateManager esté actualizado');
    } else if (timeElements.length === 0) {
        console.log('1. Verificar el temporizador en RadioCard (líneas 77-122)');
        console.log('2. Revisar que el botón esté renderizando el tiempo');
        console.log('3. Verificar que el estado isRecording esté true en el componente');
    } else {
        console.log('✅ El sistema parece estar funcionando correctamente');
    }
    
    // 7. Información adicional para debugging
    console.log('');
    console.log('📍 INFORMACIÓN ADICIONAL:');
    console.log('=========================');
    console.log(`📊 Total de botones en página: ${allButtons.length}`);
    console.log(`⏰ Elementos con tiempo encontrados: ${timeElements.length}`);
    console.log(`⚛️ Componentes React encontrados: ${reactComponents ? reactComponents.radioCards.length : 0}`);
    
    if (recordingState && recordingState.status22) {
        console.log(`📍 Estado completo radio 22:`, recordingState.status22);
    }
    
    return {
        recordingButton,
        primaveraButton,
        recordingState,
        timeElements,
        reactComponents,
        allButtons
    };
}

// Ejecutar diagnóstico inmediatamente
console.log('💡 EJECUTANDO DIAGNÓSTICO...');
const results = runFullDiagnosis();

// Guardar resultados en window para acceso posterior
window.diagnosticoResults = results;

console.log('');
console.log('✅ DIAGNÓSTICO COMPLETADO');
console.log('📊 Resultados guardados en window.diagnosticoResults');
console.log('');
console.log('🔄 Para ejecutar nuevamente, usa: runFullDiagnosis()');