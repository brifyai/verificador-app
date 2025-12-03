// Script para verificar que los datos de región y ciudad se muestran correctamente
// Este script simula lo que debería verse en la página /grabaciones

const testData = {
  recordings: [
    {
      filename: "radio_mijm9xci_test_20251201_120000_abc123.mp3",
      size: 9600000,
      created_at: "2025-12-01T12:00:00Z",
      radio_id: "mijm9xci",
      radio_name: "Radio Agricultura",
      radio_region: "Región Metropolitana",
      radio_city: "Santiago",
      radio_programadora: "Media Company",
      display_name: "Radio Agricultura",
      path: "2025-12-01/mijm9xci/radio_mijm9xci_test_20251201_120000_abc123.mp3"
    },
    {
      filename: "radio_mijm9xsi_test_20251201_140000_def456.mp3", 
      size: 14400000,
      created_at: "2025-12-01T14:00:00Z",
      radio_id: "mijm9xsi",
      radio_name: "Radio Cooperativa",
      radio_region: "Región Metropolitana",
      radio_city: "Santiago",
      radio_programadora: "Cooperativa Ltda",
      display_name: "Radio Cooperativa",
      path: "2025-12-01/mijm9xsi/radio_mijm9xsi_test_20251201_140000_def456.mp3"
    },
    {
      filename: "radio_mijm9xbi_test_20251201_160000_ghi789.mp3",
      size: 12000000,
      created_at: "2025-12-01T16:00:00Z", 
      radio_id: "mijm9xbi",
      radio_name: "Radio Bio-Bio",
      radio_region: "Región del Biobío",
      radio_city: "Concepción",
      radio_programadora: "Bio-Bio Media",
      display_name: "Radio Bio-Bio", 
      path: "2025-12-01/mijm9xbi/radio_mijm9xbi_test_20251201_160000_ghi789.mp3"
    }
  ]
};

// Simular la agrupación que hace la página
const groupedByDateAndRadio = testData.recordings.reduce((dateAcc, recording) => {
  const date = recording.created_at.split('T')[0]; // Extraer fecha
  
  if (!dateAcc[date]) {
    dateAcc[date] = {};
  }
  
  const radioKey = recording.radio_name;
  
  if (!dateAcc[date][radioKey]) {
    dateAcc[date][radioKey] = {
      name: recording.radio_name,
      radioId: recording.radio_id,
      region: recording.radio_region,
      city: recording.radio_city,
      programadora: recording.radio_programadora,
      recordings: []
    };
  }
  
  dateAcc[date][radioKey].recordings.push(recording);
  return dateAcc;
}, {});

console.log("📊 VERIFICACIÓN DE DATOS DE RADIO");
console.log("=====================================");

Object.entries(groupedByDateAndRadio).forEach(([date, radios]) => {
  console.log(`\n📅 Fecha: ${date}`);
  Object.entries(radios).forEach(([radioKey, data]) => {
    console.log(`  📻 ${radioKey}`);
    console.log(`     Región: ${data.region}`);
    console.log(`     Ciudad: ${data.city}`);
    console.log(`     Programadora: ${data.programadora}`);
    console.log(`     Grabaciones: ${data.recordings.length}`);
  });
});

console.log("\n✅ VERIFICACIÓN COMPLETA");
console.log("Los datos de región y ciudad deberían verse así en la interfaz:");
console.log("- Radio Agricultura • Región Metropolitana • Santiago");
console.log("- Radio Cooperativa • Región Metropolitana • Santiago"); 
console.log("- Radio Bio-Bio • Región del Biobío • Concepción");