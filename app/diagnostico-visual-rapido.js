// 🚀 DIAGNÓSTICO RÁPIDO - Tiempo No Visible en Frontend
// Ejecutar esto en la consola del navegador (F12)

console.log('=== DIAGNÓSTICO RÁPIDO ===');

// 1. Verificar si RecordingStateManager existe
console.log('1. RecordingStateManager:', window.recordingStateManager ? '✅ EXISTE' : '❌ NO EXISTE');

// 2. Verificar estado de radio 22 (Primavera)
if (window.recordingStateManager) {
    const isRecording22 = window.recordingStateManager.isRecording('22');
    const status22 = window.recordingStateManager.getRecordingStatus('22');
    console.log('2. Radio 22 - ¿Grabando?', isRecording22);
    console.log('3. Radio 22 - Estado:', status22);
}

// 3. Buscar botones con tiempo
const buttons = document.querySelectorAll('button');
let foundTime = false;
buttons.forEach((btn, index) => {
    const text = btn.textContent || btn.innerText || '';
    if (text.includes('Grabando') || text.match(/\d{2}:\d{2}/)) {
        console.log(`✅ Botón ${index}: "${text}"`);
        foundTime = true;
    }
});

if (!foundTime) {
    console.log('❌ No se encontró ningún botón con tiempo de grabación');
}

// 4. Verificar elementos con formato de tiempo
const allElements = document.querySelectorAll('*');
const timeElements = [];
allElements.forEach((el, index) => {
    const text = el.textContent || el.innerText || '';
    if (text && text.match(/\d{2}:\d{2}/)) {
        timeElements.push({element: el, text: text});
    }
});

console.log(`5. Elementos con tiempo HH:MM encontrados: ${timeElements.length}`);
if (timeElements.length > 0) {
    timeElements.forEach((item, i) => {
        console.log(`   ${i+1}. "${item.text}"`);
    });
}

// 5. Buscar específicamente el botón de Primavera
console.log('6. Buscando botón de Primavera...');
let primaveraFound = false;
buttons.forEach((btn, index) => {
    const text = btn.textContent || btn.innerText || '';
    if (text.includes('Primavera')) {
        console.log(`✅ Botón Primavera ${index}: "${text}"`);
        console.log(`   HTML completo:`, btn.outerHTML.substring(0, 200) + '...');
        primaveraFound = true;
    }
});

if (!primaveraFound) {
    console.log('❌ No se encontró botón con "Primavera"');
}

// 6. Verificar si hay errores en la consola
console.log('7. Verificando estado del sistema...');
console.log('   📍 URL actual:', window.location.href);
console.log('   📍 Hora actual:', new Date().toLocaleString());

console.log('');
console.log('✅ DIAGNÓSTICO COMPLETADO');
console.log('📊 Si el tiempo no aparece, el problema está en el componente RadioCard');