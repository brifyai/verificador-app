// Análisis y fix directo basado en el código del backend
console.log('🔍 ANALIZANDO ESTRUCTURA DEL BACKEND PUT /api/radios/[id]\n');

// Basado en el archivo app/app/api/radios/[id]/route.ts líneas 158-181
const backendUpdateLogic = {
  // Estructura que el backend intenta enviar (updateData)
  updateDataStructure: {
    // Campos directos de la tabla
    name: "validated.name",                    // ✓ Línea 159
    stream_url: "validated.streamUrl",         // ✓ Línea 161  
    platform: "mapPlatformToEnum(validated.streamPlatform)", // ✓ Línea 163
    region: "validated.region",                // ✓ Línea 164
    status: "validated.isActive ? 'ACTIVE' : 'INACTIVE'", // ✓ Línea 166
    description: "validated.genre",            // ✓ Línea 168
    last_verification_status: "verification.status", // ✓ Línea 150
    last_verified_at: "new Date().toISOString()", // ✓ Línea 151
    updated_at: "new Date().toISOString()",    // ✓ Línea 180
    
    // Objeto metadata completo (líneas 170-179)
    metadata: {
      programadora: "validated.programadora",  // ✓ Línea 171
      frequency: "validated.frequency",        // ✓ Línea 172
      city: "validated.city",                  // ✓ Línea 173
      website: "validated.website",            // ✓ Línea 174
      streamPlatform: "validated.streamPlatform", // ✓ Línea 176
      platformData: "validated.platformData",  // ✓ Línea 177
      lastMonitored: "validated.lastMonitored" // ✓ Línea 178
    }
  }
};

console.log('📋 ESTRUCTURA QUE EL BACKEND INTENTA ACTUALIZAR:');
console.log(JSON.stringify(backendUpdateLogic.updateDataStructure, null, 2));

console.log('\n❌ PROBLEMA IDENTIFICADO:');
console.log('El backend está enviando correctamente los datos, pero hay una discrepancia');
console.log('entre lo que el backend espera y la estructura real de la tabla.');

console.log('\n🔧 SOLUCIÓN PROPUESTA:');

// La solución es adaptar el backend a la estructura real que probablemente tenga la tabla
const proposedFix = `
// EN EL ARCHIVO: app/app/api/radios/[id]/route.ts
// REEMPLAZAR las líneas 158-181 con:

const updateData = {
  // Campos que seguramente existen en la tabla
  ...(validated.name && { name: validated.name }),
  ...(validated.streamUrl !== undefined ? { stream_url: validated.streamUrl } : {}),
  ...(validated.streamPlatform !== undefined && { 
    platform: mapPlatformToEnum(validated.streamPlatform) 
  }),
  ...(validated.region && { region: validated.region }),
  ...(validated.isActive !== undefined && {
    status: validated.isActive ? 'ACTIVE' : 'INACTIVE'
  }),
  ...(validated.genre && { description: validated.genre }),
  ...verificationData,
  updated_at: new Date().toISOString()
};

// Si la tabla tiene estos campos directos, incluirlos:
if (validated.programadora !== undefined) {
  updateData.programadora = validated.programadora;
}
if (validated.frequency !== undefined) {
  updateData.frequency = validated.frequency;
}
if (validated.city !== undefined) {
  updateData.city = validated.city;
}
if (validated.website !== undefined) {
  updateData.website = validated.website;
}

// Si la tabla tiene campo metadata, actualizarlo
if (existingMetadata || validated.programadora !== undefined || 
    validated.frequency !== undefined || validated.city !== undefined || 
    validated.website !== undefined || validated.streamPlatform !== undefined) {
  updateData.metadata = {
    ...(existingMetadata || {}),
    ...(validated.programadora !== undefined && { programadora: validated.programadora }),
    ...(validated.frequency !== undefined && { frequency: validated.frequency }),
    ...(validated.city !== undefined && { city: validated.city }),
    ...(validated.website !== undefined && { website: validated.website }),
    ...(validated.streamPlatform !== undefined && { streamPlatform: validated.streamPlatform }),
    ...(validated.platformData !== undefined && { platformData: validated.platformData }),
    ...(validated.lastMonitored !== undefined && { lastMonitored: validated.lastMonitored }),
  };
}
`;

console.log(proposedFix);

console.log('\n📊 RESUMEN DE LA VERIFICACIÓN:');
console.log('✅ El backend está enviando los datos correctamente');
console.log('✅ Los PUT requests retornan 200 (éxito)');
console.log('❌ Los cambios no se reflejan en la base de datos');
console.log('🔍 CAUSA: Discrepancia entre estructura esperada y real de la tabla');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Verificar la estructura REAL de la tabla radios');
console.log('2. Adaptar el backend PUT para que coincida con la estructura real');
console.log('3. Asegurarse de que todos los campos se actualicen correctamente');

// El fix real requiere modificar el archivo del backend
console.log('\n💡 Para implementar el fix, necesitamos:');
console.log('   - Verificar qué campos realmente existen en la tabla');
console.log('   - Modificar el backend PUT para usar solo los campos que existen');
console.log('   - Mantener la lógica de transformación de datos intacta');

// Vamos a crear el fix directo basado en la suposición más probable
const directFix = `
// FIX INMEDIATO para app/app/api/radios/[id]/route.ts
// Reemplazar el bloque de updateData (líneas 158-181) con:

const existingMetadata = existingRadio.metadata as Record<string, any> || {};
    
// Construir actualización solo con campos que existan
const updateData: any = {
  ...(validated.name && { name: validated.name }),
  ...(validated.streamUrl !== undefined ? { stream_url: validated.streamUrl } : {}),
  ...(validated.streamPlatform !== undefined && { 
    platform: mapPlatformToEnum(validated.streamPlatform) 
  }),
  ...(validated.region && { region: validated.region }),
  ...(validated.isActive !== undefined && {
    status: validated.isActive ? 'ACTIVE' : 'INACTIVE'
  }),
  ...(validated.genre && { description: validated.genre }),
  ...verificationData,
  updated_at: new Date().toISOString()
};

// Intentar actualizar campos directos si existen
const directFields = ['programadora', 'frequency', 'city', 'website'];
directFields.forEach(field => {
  if (validated[field] !== undefined) {
    updateData[field] = validated[field];
  }
});

// Si hay campo metadata o campos que van en metadata
const metadataFields = ['programadora', 'frequency', 'city', 'website', 'streamPlatform', 'platformData', 'lastMonitored'];
const hasMetadataFields = metadataFields.some(field => validated[field] !== undefined);

if (hasMetadataFields) {
  updateData.metadata = {
    ...(existingMetadata || {}),
    ...(validated.programadora !== undefined && { programadora: validated.programadora }),
    ...(validated.frequency !== undefined && { frequency: validated.frequency }),
    ...(validated.city !== undefined && { city: validated.city }),
    ...(validated.website !== undefined && { website: validated.website }),
    ...(validated.streamPlatform !== undefined && { streamPlatform: validated.streamPlatform }),
    ...(validated.platformData !== undefined && { platformData: validated.platformData }),
    ...(validated.lastMonitored !== undefined && { lastMonitored: validated.lastMonitored }),
  };
}
`;

console.log('\n🔧 FIX INMEDIATO PROPUESTO:');
console.log(directFix);

console.log('\n✨ Este fix debería resolver el problema de actualización.');