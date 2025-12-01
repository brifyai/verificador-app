const fs = require('fs');
const path = require('path');

// Leer el archivo stream-verifier-enhanced.ts
const filePath = path.join(__dirname, 'lib', 'stream-verifier-enhanced.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Analizando stream-verifier-enhanced.ts...');

// Buscar la función detectStreamType
const detectStreamTypeMatch = content.match(/function detectStreamType\(url: string\): ('ICECAST' \| 'SHOUTCAST' \| 'HLS' \| 'ZENO' \| 'OTHER') \{[\s\S]*?\n\}/);
if (!detectStreamTypeMatch) {
  console.log('❌ No se encontró la función detectStreamType');
  process.exit(1);
}

console.log('✅ Función detectStreamType encontrada');

// Verificar si ya existe detección de Tunzilla
if (content.includes('tunzilla.com') || content.includes('TUNZILLA')) {
  console.log('⚠️  La detección de Tunzilla ya parece existir');
  
  // Mostrar la función actual
  console.log('\n📋 Función detectStreamType actual:');
  console.log(detectStreamTypeMatch[0]);
  process.exit(0);
}

// Buscar la interfaz StreamVerificationResult
const streamVerificationResultMatch = content.match(/export interface StreamVerificationResult \{[\s\S]*?\}/);
if (!streamVerificationResultMatch) {
  console.log('❌ No se encontró la interfaz StreamVerificationResult');
  process.exit(1);
}

console.log('✅ Interfaz StreamVerificationResult encontrada');

// Agregar TUNZILLA al tipo streamType en la interfaz
const currentInterface = streamVerificationResultMatch[0];
const updatedInterface = currentInterface.replace(
  /streamType: ('ICECAST' \| 'SHOUTCAST' \| 'HLS' \| 'ZENO' \| 'OTHER');/,
  "streamType: 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'OTHER';"
);

// Reemplazar la interfaz
content = content.replace(currentInterface, updatedInterface);
console.log('✅ TUNZILLA agregado a StreamVerificationResult');

// Actualizar el tipo de retorno de la función detectStreamType y agregar detección
const currentFunction = detectStreamTypeMatch[0];
let updatedFunction = currentFunction.replace(
  /function detectStreamType\(url: string\): ('ICECAST' \| 'SHOUTCAST' \| 'HLS' \| 'ZENO' \| 'OTHER') \{/,
  "function detectStreamType(url: string): 'ICECAST' | 'SHOUTCAST' | 'HLS' | 'ZENO' | 'TUNZILLA' | 'OTHER' {"
);

// Agregar la detección de Tunzilla
updatedFunction = updatedFunction.replace(
  /(if \(lowerUrl\.includes\('zeno\.fm'\)\) \{[\s\S]*?return 'ZENO';\s*\}\s*\n)/,
  `$1  if (lowerUrl.includes('tunzilla.com')) {\n    return 'TUNZILLA';\n  }\n`
);

content = content.replace(currentFunction, updatedFunction);
console.log('✅ Detección de Tunzilla agregada a detectStreamType');

// Actualizar la función verifyStreamStatus para manejar TUNZILLA
const verifyStreamStatusMatch = content.match(/export async function verifyStreamStatus\(streamUrl: string\): Promise<StreamVerificationResult> \{[\s\S]*?\n\}/);
if (!verifyStreamStatusMatch) {
  console.log('❌ No se encontró la función verifyStreamStatus');
  process.exit(1);
}

console.log('✅ Función verifyStreamStatus encontrada');

// Actualizar verifyStreamStatus para manejar TUNZILLA
const currentVerifyFunction = verifyStreamStatusMatch[0];
const updatedVerifyFunction = currentVerifyFunction.replace(
  /(if \(streamType === 'ZENO'\) \{[\s\S]*?return await verifyWithHttpsModule\(streamUrl, streamType\);\s*\}\s*\n)/,
  `$1    // Tunzilla: usar verificación especial ya que no responde a HEAD
    if (streamType === 'TUNZILLA') {
      logger.info(\`Using special Tunzilla verification for: \${streamUrl}\`);
      return await verifyWithHttpsModule(streamUrl, streamType);
    }\n`
);

content = content.replace(currentVerifyFunction, updatedVerifyFunction);
console.log('✅ Caso TUNZILLA agregado a verifyStreamStatus');

// Guardar los cambios
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Archivo stream-verifier-enhanced.ts actualizado exitosamente');

// Mostrar resumen de cambios
console.log('\n📋 Resumen de cambios:');
console.log('- Agregado TUNZILLA al enum StreamType');
console.log('- Agregada detección de tunzilla.com en detectStreamType');
console.log('- Agregado caso TUNZILLA en verifyStreamEnhanced con verificación RANGE');

// Verificar el resultado final
const finalContent = fs.readFileSync(filePath, 'utf8');
const finalDetectStreamType = finalContent.match(/function detectStreamType\(url: string\): StreamType \{[\s\S]*?\n\}/);
if (finalDetectStreamType) {
  console.log('\n📋 Nueva función detectStreamType:');
  console.log(finalDetectStreamType[0]);
}