const fs = require('fs');
const path = require('path');

// Leer el archivo del verificador mejorado
const verifierPath = path.join(__dirname, 'lib/stream-verifier-enhanced.ts');
let content = fs.readFileSync(verifierPath, 'utf8');

console.log('🔄 Actualizando detección de TECNOERA...');

// 1. Agregar TECNOERA a la interfaz StreamVerificationResult
if (!content.includes("'TECNOERA'")) {
    content = content.replace(
        /type StreamType = 'ICECAST' \| 'SHOUTCAST' \| 'DIRECT' \| 'ZENO' \| 'TUNZILLA' \| 'CLOUDFLARE'/,
        "type StreamType = 'ICECAST' | 'SHOUTCAST' | 'DIRECT' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA'"
    );
    console.log('✅ Agregado TECNOERA a StreamType');
}

// 2. Agregar detección de TECNOERA en detectStreamType
if (!content.includes('tecnoera.com')) {
    const detectStreamTypeMatch = content.match(/function detectStreamType\(url: string\): StreamType \{[\s\S]*?\n\}/);
    if (detectStreamTypeMatch) {
        const oldFunction = detectStreamTypeMatch[0];
        const newFunction = oldFunction.replace(
            /if \(url\.includes\('tunzilla\.com'\)\) return 'TUNZILLA';/,
            `if (url.includes('tunzilla.com')) return 'TUNZILLA';\n    if (url.includes('tecnoera.com')) return 'TECNOERA';`
        );
        content = content.replace(oldFunction, newFunction);
        console.log('✅ Agregada detección de TECNOERA');
    }
}

// 3. Agregar manejo especial para TECNOERA en verifyStreamStatus
if (!content.includes("case 'TECNOERA':")) {
    const verifyStreamStatusMatch = content.match(/case 'TUNZILLA':[\s\S]*?break;/);
    if (verifyStreamStatusMatch) {
        const tunzillaCase = verifyStreamStatusMatch[0];
        const tecnoeraCase = tunzillaCase.replace(/TUNZILLA/g, 'TECNOERA');
        content = content.replace(tunzillaCase, tunzillaCase + '\n\n' + tecnoeraCase);
        console.log('✅ Agregado caso TECNOERA en verifyStreamStatus');
    }
}

// Guardar los cambios
fs.writeFileSync(verifierPath, content);
console.log('✅ Verificador mejorado actualizado con soporte TECNOERA');

// También actualizar el verificador principal
const mainVerifierPath = path.join(__dirname, 'lib/stream-verifier.ts');
if (fs.existsSync(mainVerifierPath)) {
    let mainContent = fs.readFileSync(mainVerifierPath, 'utf8');
    
    // Agregar TECNOERA al tipo StreamType
    if (!mainContent.includes("'TECNOERA'")) {
        mainContent = mainContent.replace(
            /type StreamType = 'ICECAST' \| 'SHOUTCAST' \| 'DIRECT' \| 'ZENO' \| 'TUNZILLA' \| 'CLOUDFLARE'/,
            "type StreamType = 'ICECAST' | 'SHOUTCAST' | 'DIRECT' | 'ZENO' | 'TUNZILLA' | 'CLOUDFLARE' | 'TECNOERA'"
        );
    }
    
    // Agregar detección de TECNOERA
    if (!mainContent.includes('tecnoera.com')) {
        mainContent = mainContent.replace(
            /if \(url\.includes\('tunzilla\.com'\)\) return 'TUNZILLA';/,
            `if (url.includes('tunzilla.com')) return 'TUNZILLA';\n    if (url.includes('tecnoera.com')) return 'TECNOERA';`
        );
    }
    
    fs.writeFileSync(mainVerifierPath, mainContent);
    console.log('✅ Verificador principal actualizado con soporte TECNOERA');
}

console.log('\n🎉 ¡Actualización completada!');
console.log('\n📋 Resumen de cambios:');
console.log('- ✅ Agregado TECNOERA como nuevo tipo de stream');
console.log('- ✅ Implementada detección de URLs con tecnoera.com');
console.log('- ✅ Agregado manejo especial para servidores TECNOERA');
console.log('- ✅ Actualizados ambos verificadores (mejorado y principal)');